# Repository knowledge

## CI workflow maintenance

- [ci.yml](../.github/workflows/ci.yml) uses full-SHA v7 pins for `actions/checkout`, `actions/setup-node`. Application language versions and explicit cache settings are preserved.
- Obsolete runs for the same pull request or branch are cancelled. Existing timeout caps are preserved.

Reviewed base: `e20fa62c16135b391b42a000fb55bbc973bf2ca2`. Source checks do not prove runtime, deployment or device behavior.
