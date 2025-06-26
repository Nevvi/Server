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
    """Extract JWT token from Authorization header"""
    # API Gateway normalizes header names to lowercase
    auth_header = (
            headers.get('authorization') or
            headers.get('Authorization') or
            headers.get('authorizationToken') or
            ''
    )

    if not auth_header:
        raise AuthorizerError("Missing Authorization header")

    parts = auth_header.split()

    # Bearer token without Bearer prefix
    if len(parts) == 1:
        return parts[0]

    # Bearer token with Bearer prefix
    if len(parts) == 2 or parts[0].lower() == 'bearer':
        return parts[1]

    raise AuthorizerError("Invalid Authorization header format. Expected 'Bearer <token>'")


def decode_jwt_token(token: str) -> TokenAttributes:
    """Decode and validate JWT token"""
    try:
        payload = jwt.api_jwt.decode(
            jwt=token,
            options={
                'verify_signature': False,
                'verify_exp': True,
                'verify_iat': True,
                'require_exp': True,
                'require_iat': True
            }
        )

        # Validate required claims
        if 'cognito:username' not in payload and 'sub' not in payload:
            raise AuthorizerError("Token missing username or sub claim")

        return TokenAttributes(user_id=payload['cognito:username'], sub=payload['sub'])
    except Exception as e:
        raise AuthorizerError(f"Token validation error: {str(e)}")


class AbstractAuthorizer:
    def authorize(self, event):
        headers = event.get("headers", {})
        auth_token = extract_token_from_header(headers)
        token_attributes = decode_jwt_token(auth_token)

        policy = self.build_policy(token_attributes.sub, event.get('methodArn'))
        self.generate_permissions(policy, token_attributes.user_id)
        auth_response = policy.build()

        auth_response['context'] = {
            'userId': token_attributes.user_id
        }

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
