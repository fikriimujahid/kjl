variable "function_name" {
  description = "Lambda function name."
  type        = string
}

variable "description" {
  description = "Lambda function description."
  type        = string
  default     = null
}

variable "source_dir" {
  description = "Retained for compatibility. Lambda code is bootstrapped with module dummy content; CI/CD manages deployed code afterward."
  type        = string
}

variable "handler" {
  description = "Lambda handler entrypoint."
  type        = string
  default     = "handler.main"
}

variable "runtime" {
  description = "Lambda runtime."
  type        = string
  default     = "nodejs20.x"
}

variable "memory_size" {
  description = "Memory size (MB) for Lambda."
  type        = number
  default     = 256
}

variable "timeout" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 10
}

variable "role_arn" {
  description = "IAM role ARN attached to Lambda."
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for Lambda."
  type        = map(string)
  default     = {}
}

variable "publish" {
  description = "Whether to publish a new Lambda version on updates."
  type        = bool
  default     = true
}

variable "architectures" {
  description = "Instruction set architectures for Lambda."
  type        = list(string)
  default     = ["x86_64"]
}

variable "layers" {
  description = "Optional Lambda layer ARNs."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to Lambda resources."
  type        = map(string)
  default     = {}
}
