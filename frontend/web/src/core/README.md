# Core Layer

This folder contains cross-cutting runtime concerns shared by all features.

- `env`: environment access and validation helpers.
- `http`: fetch wrappers and response parsing helpers.
- `security`: safe defaults and helper guards.

Keep feature business rules out of this layer.