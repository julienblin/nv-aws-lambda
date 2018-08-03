const Generator = require('yeoman-generator');
const figlet = require('figlet');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  initializing() {
    this.log();
    this.log();
    this.log("            IIIIIIII                    ");
    this.log("            IIIIIIII                    ");
    this.log("                IIIII                   ");
    this.log("                IIIII,                  ");
    this.log("                 IIIII                  ");
    this.log("                 IIIIII                 ");
    this.log("                IIIIIII                 ");
    this.log("               IIIIIIIII                ");
    this.log("              IIIIIIIIIII               ");
    this.log("             IIIIII IIIII               ");
    this.log("            IIIIII  IIIII7              ");
    this.log("           IIIIII    IIIII,             ");
    this.log("          IIIIII      IIIII             ");
    this.log("         IIIIII       IIIIII  II        ");
    this.log("        IIIIII         IIIIIIIII,       ");
    this.log("       IIIIII          ,IIIIIIIII       ");
    this.log("      IIIIII            IIIIII          ");
    this.log();
    this.log();
  }

  prompting() {
    return this.prompt([{
      type: "input",
      name: "projectName",
      message: "Project name (kebab-case e.g. my-awesome-project)",
      default: this.appname,
      require: true
    },
    {
      type: "input",
      name: "projectDescription",
      message: "Description"
    },
    {
      type: "list",
      name: "projectType",
      message: "Project type",
      choices: [
        {
          name: "Azure Functions",
          value: "azure"
        },
        {
          name: "AWS Lambda / serverless",
          value: "aws-lambda-sls"
        }
      ],
      require: true
    }]).then((answers) => {
      this.props = answers;
      this.destinationRoot(`./${answers.projectName}`);
    });
  }

  dependencies() {
    switch(this.props.projectType) {
      case "azure":
        this._dependenciesAzure();
        break;
      case "aws-lambda-sls":
        this._dependenciesAwsLambdaSls();
        break;
    }
  }

  _dependenciesAzure() {
    this.npmInstall([
      "source-map-support@latest",
      "uno-serverless@latest",
      "uno-serverless-azure@latest",
    ],
    { "save": true });

    this.npmInstall([
      "@types/chai@latest",
      "@types/mocha@latest",
      "cache-loader@latest",
      "chai@latest",
      "copy-webpack-plugin@latest",
      "file-loader@latest",
      "fork-ts-checker-webpack-plugin@latest",
      "js-yaml@latest",
      "mocha@latest",
      "mocha-junit-reporter@latest",
      "newman@latest",
      "nyc@latest",
      "rimraf@latest",
      "thread-loader@latest",
      "ts-loader@latest",
      "ts-node@latest",
      "tsconfig-paths@latest",
      "tsconfig-paths-webpack-plugin@latest",
      "tslint@latest",
      "tslint-no-unused-expression-chai@latest",
      "typescript@latest",
      "webpack@latest",
      "webpack-cli@latest",
      "webpack-spawn-plugin@latest",
      "zip-webpack-plugin@latest"
    ],
    { "save-dev": true });
  }

  _dependenciesAwsLambdaSls() {
    this.npmInstall([
      "aws-sdk@latest",
      "source-map-support@latest",
      "uno-serverless@latest",
      "uno-serverless-aws@latest",
    ],
    { "save": true });

    this.npmInstall([
      "@types/chai@latest",
      "@types/mocha@latest",
      "cache-loader@latest",
      "chai@latest",
      "fork-ts-checker-webpack-plugin@latest",
      "mocha@latest",
      "newman@latest",
      "nyc@latest",
      "serverless@latest",
      "serverless-offline@latest",
      "serverless-webpack@latest",
      "thread-loader@latest",
      "ts-loader@latest",
      "ts-node@latest",
      "tsconfig-paths@latest",
      "tsconfig-paths-webpack-plugin@latest",
      "tslint@latest",
      "tslint-no-unused-expression-chai@latest",
      "typescript@latest",
      "webpack@latest"
    ],
    { "save-dev": true });
  }

  writing() {
    switch(this.props.projectType) {
      case "azure":
        this._writingAzure();
        break;
      case "aws-lambda-sls":
        this._writingAwsLambdaSls();
        break;
    }

    this.config.set("projectType", this.props.projectType);
  }

  _writingAzure() {
    [
      "_.vscode/extensions.json",
      "_.vscode/settings.json",
      "deploy/azuredeploy.json",
      "src/handlers/common.ts",
      "src/handlers/health.json",
      "src/handlers/health.ts",
      "src/handlers/openapi.json",
      "src/handlers/openapi.ts",
      "src/config.ts",
      "test/e2e/e2e.collection.json",
      "test/unit/handlers/common.test.ts",
      "test/mocha.opts",
      "_.editorconfig",
      "_.gitignore",
      "_package.json",
      "host.json",
      "local.settings.json",
      "openapi.yml",
      "proxies.json",
      "README.md",
      "tsconfig.json",
      "tslint.json",
      "webpack.config.js",
    ].forEach((x) => {
      this.fs.copyTpl(
        this.templatePath(`azure/${x}`),
        this.destinationPath(x.startsWith("_") ? x.slice(1) : x),
        this.props
      );
    });
  }

  _writingAwsLambdaSls() {
    [
      "_.vscode/extensions.json",
      "_.vscode/settings.json",
      "build/api-version.js",
      "build/openapi.js",
      "build/source-map-install.js",
      "build/timestamp.js",
      "src/handlers/common.ts",
      "src/handlers/health.ts",
      "src/config.ts",
      "test/e2e/e2e.collection.json",
      "test/unit/handlers/common.test.ts",
      "test/mocha.opts",
      "_.editorconfig",
      "_.gitignore",
      "_package.json",
      "cf-resources.yml",
      "openapi.yml",
      "README.md",
      "serverless.yml",
      "tsconfig.json",
      "tslint.json",
      "webpack.config.js",
    ].forEach((x) => {
      this.fs.copyTpl(
        this.templatePath(`aws-lambda-sls/${x}`),
        this.destinationPath(x.startsWith("_") ? x.slice(1) : x),
        this.props
      );
    });
  }

  end() {
    this.log();
    this.log();
    this.log(figlet.textSync("Have fun!"));
    this.log();
    this.log();
    this.log("To get started:");
    this.log("--------------");
    this.log();
    this.log(`cd ${this.destinationPath()}`);
    switch (this.props.projectType) {
      case "azure":
        this.log("npm start.");
        break;
      case "aws":
        this.log("npm start -- local.");
        break;
    }
    this.log("npm run (to list all the available scripts).");
    this.log();
  }
};
