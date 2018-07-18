# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- CryptoService that implements bcrypt & aes-256-gcm

## [0.42.0] - 2018-07-18
### Added
- TemplateEngine interface + uno-serverless-handlebars implementation
- Core event services
- Azure Queue Storage event publisher
- duration() helper based on [ms](https://www.npmjs.com/package/ms)
- support for etag concurrency check on DocumentDb
- forbiddenError
- principalFromBasicAuthorizationHeader

### Changed
- Generator template for Azure functions: better start script & zipping
- Health checks for BlobStorage no longer writes a temp file, only create container if not exists
- Internalized HttpStatusCodes.
- Context.log now has support for info, warn & error.