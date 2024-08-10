import * as esbuild from 'esbuild';
import {dtsPlugin} from 'esbuild-plugin-d.ts';
import {nodeExternalsPlugin} from 'esbuild-node-externals';

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: './dist/cjs/index.js',
  plugins: [
    nodeExternalsPlugin(),
    dtsPlugin({experimentalBundling: true, tsconfig: 'tsconfig.cjs.json'}),
  ],
});

await esbuild.build({
  entryPoints: ['./src/cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: './dist/cli.js',
  plugins: [
    nodeExternalsPlugin(),
  ],
});

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  outfile: './dist/esm/index.js',
  plugins: [
    nodeExternalsPlugin(),
    dtsPlugin({experimentalBundling: true}),
  ],
});
