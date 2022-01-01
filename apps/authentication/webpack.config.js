const path = require('path');
const slsw = require('serverless-webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    // https://webpack.js.org/configuration/mode/
    mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
    // https://webpack.js.org/concepts/entry-points/
    entry: slsw.lib.entries,
    target: 'node',
    resolve: {
        // https://webpack.js.org/configuration/resolve/#resolveextensions
        extensions: ['.js', '.ts', 'tsx'],
    },
    // Where the bundled files will be output. Not strictly necessary with Serverless Webpack.
    // https://webpack.js.org/configuration/output/
    // output: {
    //     libraryTarget: 'commonjs2',
    //     path: path.join(__dirname, '.webpack'),
    //     filename: '[name].js',
    // },
    //
    // In AWS Lambda, the `aws-sdk` is available and we almost certainly want to
    // exclude it from our bundle(s).
    externals: ['aws-sdk'],
    module: {
        // Instruct Webpack to use the `ts-loader` for any TypeScript files, else it
        // won't know what to do with them.
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: [
                    [
                        path.resolve(__dirname, '.webpack'),
                        path.resolve(__dirname, '.serverless'),
                    ],
                ],
                // And here we have options for ts-loader
                // https://www.npmjs.com/package/ts-loader#options
                options: {
                    // Disable type checking, this will lead to improved build times
                    transpileOnly: true,
                    // Enable file caching, can be quite useful when running offline
                    experimentalFileCaching: true,
                },
            },
        ],
    },
    // We still want type checking, just without the burden on build performance,
    // so we use a plugin to take care of it on another thread.
    plugins: [new ForkTsCheckerWebpackPlugin()],
};