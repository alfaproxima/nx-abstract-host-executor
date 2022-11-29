import path = require("path");
import {readFile, writeFile} from "fs/promises";
import {parseTargetString, readTargetOptions} from "@nrwl/devkit";
import {ExecutorContext} from "nx/src/config/misc-interfaces";
import {runExecutor} from "nx/src/command-line/run";
import {parse} from 'node-html-parser';
import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import {AbstractHostExecutorSchema} from './schema';
import abstractHostApiTransformer from "../../transformers/abstract-host-api.transformer";

let webpackServer;

export default async function abstractHostExecutor(
    options: AbstractHostExecutorSchema,
    context: ExecutorContext,
) {
    const {mock, port, target = 'serve', apiParam = 'default', banner = false} = options;

    const root = context.workspace.projects[context.projectName].sourceRoot;
    const mockPath = path.join(context.root, root, mock);

    console.log(`Abstract host running for target "${context.projectName}:${target}" `, options);

    const childOpts = readTargetOptions(
        parseTargetString(`${context.projectName}:${target}`),
        context,
    );

    const result = await Promise.race([
        await runExecutor(
            {project: context.projectName, target: target},
            {watch: true},
            context)
    ]);

    await updateHostIndex(childOpts.port, context.projectName, banner);
    await runHostApplication(mockPath, port, apiParam);

    for await (const res of result) {
        if (!res.success) return res;

        if (webpackServer) {
            webpackServer.sendMessage(webpackServer.webSocketServer.clients,
                'hash',
                Date.now().toString()
            );

            webpackServer.sendMessage(webpackServer.webSocketServer.clients, 'ok');
        }
    }

    return {
        success: true,
    };
}

async function runHostApplication(mockPath: string, port: number, apiParam: string) {
    global.ABSTRACT_HOST_API_PARAM = apiParam;

    let compiler = webpack({
        mode: 'development',
        entry: path.join(mockPath),
        output: {
            path: path.join(__dirname, 'app'),
            filename: 'api-mock.js'
        },
        plugins: [new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, 'app', 'index.html')
        })],
        module: {
            rules: [
                {
                    test: /\.ts(x)?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        getCustomTransformers: () => ({after: [abstractHostApiTransformer]})
                    }
                }
            ]
        },
        resolve: {
            extensions: [
                '.ts',
                '.js'
            ]
        }
    });

    webpackServer = new WebpackDevServer({port}, compiler);

    return webpackServer.start();
}

async function updateHostIndex(appPort: string, appName: string, banner: boolean) {
    const indexPath = path.join(__dirname, 'app', 'index.html');
    const indexFile = await readFile(indexPath, {encoding: 'utf-8'});
    const index = parse(indexFile);

    const header = index.querySelector('.abstract-host-container .abstract-host-header');
    const name = index.querySelector('.abstract-host-container .ahc-appname');
    name.set_content(appName);

    banner ? header.classList.add('visible') : header.classList.remove('visible');

    const outlet = index.querySelector('.abstract-host-container .ahc-outlet');
    outlet.setAttribute('data-url', `http://localhost:${appPort}`);

    await writeFile(indexPath, index.toString(), {encoding: 'utf-8'});
}
