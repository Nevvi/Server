const shell = require('shelljs');

const stage = shell.env['AWS_STAGE'];
if (!stage) {
    shell.echo("ERROR: Missing required environment variable AWS_STAGE");
    shell.exit(1);
}

shell.echo("Deploying apps to stage: " + stage);

shell.cd("apps");
shell.ls().forEach(function (dir) {
    shell.cd(dir);
    shell.exec('node ../../node_modules/serverless/bin/serverless.js deploy --stage ' + stage);
    shell.cd('..');
});