from dataclasses import dataclass
from typing import Dict

import jwt

from src.functions.AuthPolicy import AuthPolicy, ApiOptions


class AuthorizerError(Exception):
    """Custom exception for authorization errors"""
    pass


@dataclass
class TokenAttributes:
    user_id: str
    sub: str


def extract_token_from_header(headers: Dict[str, str]) -> str:
    print("Extracting auth header from request")
    """Extract JWT token from Authorization header"""
    # API Gateway normalizes header names to lowercase
    auth_header = (
            headers.get('authorization') or
            headers.get('Authorization') or
            headers.get('authorizationToken') or
            ''
    )

    print(f"Got auth header: {auth_header}")
    if not auth_header:
        raise AuthorizerError("Missing Authorization header")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise AuthorizerError("Invalid Authorization header format. Expected 'Bearer <token>'")

    return parts[1]


def decode_jwt_token(token: str) -> TokenAttributes:
    """Decode and validate JWT token"""
    print(f"Decoding JWT token: {token}")
    try:
        payload = jwt.decode(
            token,
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_iat': True,
                'require_exp': True,
                'require_iat': True
            }
        )

        print(f"Decoded token: {payload}")

        # Validate required claims
        if 'cognito:username' not in payload and 'sub' not in payload:
            raise AuthorizerError("Token missing username or sub claim")

        return TokenAttributes(user_id=payload['cognito:username'], sub=payload['sub'])

    except jwt.ExpiredSignatureError:
        raise AuthorizerError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise AuthorizerError(f"Invalid token: {str(e)}")
    except Exception as e:
        raise AuthorizerError(f"Token validation error: {str(e)}")


class AbstractAuthorizer:
    def authorize(self, event):
        headers = event.get("headers", {})
        auth_token = extract_token_from_header(headers)
        token_attributes = decode_jwt_token(auth_token)

        print(f"Building policy from method arn: {event.methodArn}")
        policy = self.build_policy(token_attributes.sub, event.methodArn)
        print("Generating permissions for policy")
        self.generate_permissions(policy, token_attributes.user_id)
        print("Building policy")
        auth_response = policy.build()

        print(f"Generated auth response: {auth_response}")
        auth_response['context'] = {
            'userId': token_attributes.user_id
        }

        print(f"Final auth response: {auth_response}")
        return auth_response

    def build_policy(self, token_sub: str, method_arn: str) -> AuthPolicy:
        principal_id = f"user|${token_sub}"
        tmp = method_arn.split(':')
        api_gateway_arn_tmp = tmp[5].split('/')
        aws_account_id = tmp[4]
        api_options = ApiOptions(region=tmp[3], rest_api_id=api_gateway_arn_tmp[0], stage=api_gateway_arn_tmp[1])

        return AuthPolicy(principal_id, aws_account_id, api_options)

    def generate_permissions(self, auth_policy: AuthPolicy, user_id: str):
        auth_policy.deny_all_methods()
