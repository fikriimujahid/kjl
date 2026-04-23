output "role_arn" {
  value = module.role.role_arn
}

output "role_name" {
  value = module.role.role_name
}

output "github_oidc_provider_arn" {
  value = var.github_oidc_provider_arn
}