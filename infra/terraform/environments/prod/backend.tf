terraform {
  backend "s3" {
    bucket         = "terraform-state-731099197523"
    key            = "kejepangdulu/prod"
    region         = "ap-southeast-1"
    dynamodb_table = "terraform-lock-731099197523"
    encrypt        = true
  }
}
