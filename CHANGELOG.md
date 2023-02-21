# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
