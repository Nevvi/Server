'use strict'

import {ObjectList} from "aws-sdk/clients/s3";

const AWS = require('aws-sdk')
import {S3} from "aws-sdk";

class ImageDao {
    s3: S3
    bucket: string
    constructor() {
        this.s3 = new AWS.S3();
        // @ts-ignore
        this.bucket = process.env.IMAGE_BUCKET
    }

    async uploadImage(userId: string, decodedImage: Buffer, fileName: string, contentType: string): Promise<string> {
        const params = {
            "Body": decodedImage,
            "Bucket": this.bucket,
            "Key": `users/${userId}/images/${fileName}`,
            "ContentType": contentType,
            'ACL': 'public-read'
        }

        const res = await this.s3.upload(params).promise();
        return res.Location
    }

    async removeOldImages(userId: string, excludedFile: string) {
        const objectList = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Delimiter: '/',
            Prefix: `users/${userId}/images/`
        }).promise()

        const images: ObjectList = objectList.Contents ? objectList.Contents : []
        for (const image of images) {
            if (!image.Key?.includes(excludedFile)) {
                await this.s3.deleteObject({
                    Bucket: this.bucket,
                    Key: image.Key!
                }).promise()
            }
        }
    }

    async getImage(key: string): Promise<S3.GetObjectOutput> {
        const params = {
            "Bucket": this.bucket,
            "Key": key
        }

        return await this.s3.getObject(params).promise();
    }
}

export {ImageDao}