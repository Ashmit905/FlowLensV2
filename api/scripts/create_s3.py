import boto3
import sys
import json
from botocore.exceptions import ClientError

def create_bucket(bucket_name, region=None):
    s3 = boto3.client('s3', region_name=region)
    try:
        if region is None:
            s3.create_bucket(Bucket=bucket_name)
        else:
            s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={'LocationConstraint': region})
        print('Bucket created:', bucket_name)
    except ClientError as e:
        print('Error creating bucket:', e)
        raise

def put_cors(bucket_name):
    s3 = boto3.client('s3')
    cors = {
        'CORSRules': [
            {
                'AllowedOrigins': ['*'],
                'AllowedMethods': ['GET','PUT','POST','DELETE','HEAD'],
                'AllowedHeaders': ['*']
            }
        ]
    }
    s3.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors)
    print('CORS applied to', bucket_name)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python create_s3.py <bucket-name> [region]')
        sys.exit(1)
    bucket = sys.argv[1]
    region = sys.argv[2] if len(sys.argv) > 2 else None
    create_bucket(bucket, region=region)
    put_cors(bucket)
    print('\nNext steps:')
    print(' - Export S3_BUCKET environment variable:')
    print(f'    export S3_BUCKET={bucket}')
    print(' - Restart backend and call /api/save to test uploads')
