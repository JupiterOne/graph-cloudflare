# v0.8.1 (Tue Sep 12 2023)

#### 🐛 Bug Fix

- INT-9168: fix duplicated key issue [#54](https://github.com/JupiterOne/graph-cloudflare/pull/54) ([@gastonyelmini](https://github.com/gastonyelmini))
- INT-8135 - Scope Documentation Updates [#53](https://github.com/JupiterOne/graph-cloudflare/pull/53) ([@adam-in-ict](https://github.com/adam-in-ict))

#### Authors: 2

- Adam Pierson ([@adam-in-ict](https://github.com/adam-in-ict))
- Gaston Yelmini ([@gastonyelmini](https://github.com/gastonyelmini))

---

# v0.8.0 (Mon Jul 10 2023)

#### 🚀 Enhancement

- INT-8135 - Fixing node version for build and release step. [#52](https://github.com/JupiterOne/graph-cloudflare/pull/52) ([@adam-in-ict](https://github.com/adam-in-ict))
- INT-8135 - Add mapped relationship to Okta applications [#51](https://github.com/JupiterOne/graph-cloudflare/pull/51) ([@adam-in-ict](https://github.com/adam-in-ict))

#### Authors: 1

- Adam Pierson ([@adam-in-ict](https://github.com/adam-in-ict))

---

## 0.6.6 - 2023-04-25

- Add assign tags functionality for cloudflare DNS tags

## Changed

- Upgraded SDK dependencies to v8
- Updated build.yml
- Updated package.json main, types, and files to work with updated build.yml
- Updated project [README.md](http://README.md '‌')
- Added jupiterone/questions/questions.yaml file
- Upgraded package.json scripts to match an `integration-template`
- Updated tests to use latest patterns

## 0.6.5 - 2023-02-15

### Fixed

- Fix RequestEntityTooLargeException by upgrading sdk packages

## 0.6.4 - 2021-10-08

- Add logging to uncover `multipleResolves` issues

## 0.6.3 - 2021-10-04

- Add logging to expose retry behavior and error details

## 0.6.2 - 2021-09-28

- Fix floating promise that would hang the process and mishandle ECONNRESET
  error

## 0.6.1 - 2021-09-27

- Report authentication and authorization errors to users instead of operator
- Retry ECONNRESET errors from Cloudflare API server

## 0.6.0 - 2021-09-16

- Move to `main` branch, update build process to latest approach
- Upgrade all packages to latest compatible versions

## 0.5.1 - 2020-11-06

### Fixed

- Duplicate `_key` for `cloudflare_account_role` entities

## 0.5.0 - 2020-10-29

### Changed

- Upgrade SDK v4

## 0.4.0 - 2020-10-22

### Changed

- Changed `cloudflare_account_role|assigned|member` to
  `cloudflare_account_member|assigned|role`
- Upgrade sdk@v3.6.0
- Use iterators in client; don't hold all entity data in memory
- Use `@cloudflare/types` typing instead of internal types

## 0.1.0 - 2020-05-18

### Added

- Initial release.
