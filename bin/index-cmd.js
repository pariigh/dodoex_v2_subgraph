#!/usr/bin/env node

const program = require("commander");
const inquirer = require("inquirer");
const execSh = require("exec-sh");
const {
  studioNodeUrl,
  theGraphNodeUrl,
  theGraphIpfsUrl,
  localNodeUrl,
  localIpfsUrl,
  chains,
  supportAlphaChains,
  supportStudioChains,
} = require("./config");

function getCpCmd(name) {
  return `cp ./src/mappings/constant-${name}.ts ./src/mappings/constant.ts `;
}
function createConfig() {
  const deployDodoex = createDeployDodoexConfig();
  const deployDodomine = createDeployConfig(
    "dodomine",
    "dodoex-mine-v3",
    "subgraphs/mine/mine",
    "mine"
  );
  const deployToken = createDeployConfig(
    "token",
    "dodoex-token",
    "subgraphs/token/token"
  );
  return Object.assign(
    deployDodoex,
    deployDodomine,
    deployToken,
    getDefaultConfig()
  );
}
function createDeployDodoexConfig() {
  const getCodegenCmd = (name) => {
    return `graph codegen subgraphs/dodoex/dodoex_${name}.yaml --output-dir ./src/types/dodoex/ `;
  };
  const deployDodoex = {};
  for (const chain of chains) {
    deployDodoex[`deploy:dodoex_${chain}`] = `${getCpCmd(
      chain
    )} && ${getCodegenCmd(
      chain
    )} && graph deploy --ipfs ${theGraphIpfsUrl} --node ${theGraphNodeUrl} dodoex/dodoex-v2-${chain} subgraphs/dodoex/dodoex_${chain}.yaml`;
    deployDodoex[`deploy:local:dodoex_${chain}`] = `${getCpCmd(
      chain
    )} && ${getCodegenCmd(
      chain
    )} && graph deploy --ipfs ${localIpfsUrl} --node ${localNodeUrl} dodoex/dodoex-v2-${chain} subgraphs/dodoex/dodoex_${chain}.yaml`;
  }
  for (const chain of supportAlphaChains) {
    deployDodoex[`deploy:dodoex_${chain}_alpha`] = `${getCpCmd(
      chain
    )} && ${getCodegenCmd(
      chain
    )} && graph deploy --ipfs ${theGraphIpfsUrl} --node ${theGraphNodeUrl} dodoex/dodoex-v2-${chain}-alpha subgraphs/dodoex/dodoex_${chain}-graft.yaml`;
  }
  for (const chain of supportStudioChains) {
    deployDodoex[`deploy:studio:dodoex_${chain}`] = `${getCpCmd(
      chain
    )} && ${getCodegenCmd(
      chain
    )} && graph deploy --node ${studioNodeUrl} dodoex_v2_${chain} subgraphs/dodoex/dodoex_${chain}.yaml`;
  }
  deployDodoex["deploy:dodoex_okchain"] = `${getCpCmd(
    "okchain"
  )} && ${getCodegenCmd(
    "okchain"
  )} && graph deploy --ipfs https://ipfs.kkt.one --node https://graph.kkt.one/node/ dodoex/dodoex-v2-okchain subgraphs/dodoex/dodoex_okchain.yaml --access-token `;
  return deployDodoex;
}
function createDeployConfig(key, subgraphName, path, typePath) {
  const getCodegenCmd = (name) => {
    return `graph codegen ${path}_${name}.yaml --output-dir ./src/types/${typePath ||
      key}/ `;
  };
  const deployConfig = {};
  for (const chain of chains) {
    deployConfig[`deploy:${key}_${chain}`] = `${getCodegenCmd(
      chain
    )} && graph deploy --ipfs ${theGraphIpfsUrl} --node ${theGraphNodeUrl} dodoex/${subgraphName}-${chain} ${path}_${chain}.yaml`;
    deployConfig[`deploy:local:${key}_${chain}`] = `${getCodegenCmd(
      chain
    )} && graph deploy --ipfs ${localIpfsUrl} --node ${localNodeUrl} dodoex/${subgraphName}-${chain} ${path}_${chain}.yaml`;
  }
  for (const chain of supportStudioChains) {
    deployConfig[`deploy:studio:${key}_${chain}`] = `${getCodegenCmd(
      chain
    )} && graph deploy --node ${studioNodeUrl} ${subgraphName}-${chain} ${path}_${chain}.yaml`;
  }
  return deployConfig;
}

const config = createConfig();

program.option("-c, --cmd <name>", Object.keys(config).join(" , "));

program.parse(process.argv);

const options = program.opts();
let cmd = options.cmd;

async function run() {
  if (cmd) {
    console.log(`cmd: ${cmd}`);
  } else {
    const promps = [];
    if (!cmd) {
      promps.push({
        type: "rawlist",
        name: "cmd",
        message: "Please select the name",
        choices: Object.keys(config),
      });
    }
    const answers = await inquirer.prompt(promps);
    cmd = answers.cmd;
  }
  if (config[cmd]) {
    let commands = config[cmd];
    const res = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: `
            Generated commands: ${commands}
            `,
    });
    if (res.confirm) {
      execSh(commands, {}, (err) => {
        if (err) {
          console.log("Exit code: ", err.code);
          return;
        }
      });
    }
  } else {
    console.error(`cmd: ${cmd} not find`);
  }
}

run();

function getDefaultConfig() {
  const config1 = {
    "deploy:dodoex_okchain":
      "cp ./src/mappings/constant-okchain.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_okchain.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://ipfs.kkt.one --node https://graph.kkt.one/node/ dodoex/dodoex-v2-okchain subgraphs/dodoex/dodoex_okchain.yaml --access-token ",
    "deploy:dodoex:arbitrum": "--------------------------------------",
    "deploy:studio:dodoex_arbitrum":
      "cp ./src/mappings/constant-arbitrum.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_arbitrum.yaml --output-dir ./src/types/dodoex/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex-v2-arbitrum subgraphs/dodoex/dodoex_arbitrum.yaml",
    "deploy:dodoex_arbitrum":
      "cp ./src/mappings/constant-arbitrum.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_arbitrum.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-arbitrum subgraphs/dodoex/dodoex_arbitrum.yaml",
    "deploy:dodoex_arbitrum_alpha":
      "cp ./src/mappings/constant-arbitrum.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_arbitrum-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-arbitrum-alpha subgraphs/dodoex/dodoex_arbitrum-graft.yaml",
    "deploy:dodoex_arbitrum_rinkeby":
      "cp ./src/mappings/constant-arbitrum.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_arbitrum_rinkeby.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-arbitrum-rinkeby subgraphs/dodoex/dodoex_arbitrum_rinkeby.yaml",
    "deploy:dodoex_optimism":
      "cp ./src/mappings/constant-optimism.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_optimism.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-optimism subgraphs/dodoex/dodoex_optimism.yaml",
    "deploy:dodoex:polygon": "--------------------------------------",
    "deploy:dodoex_polygon":
      "cp ./src/mappings/constant-polygon.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_polygon-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-polygon subgraphs/dodoex/dodoex_polygon-graft.yaml",
    "deploy:dodoex_polygon_alpha":
      "cp ./src/mappings/constant-polygon.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_polygon-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-polygon-alpha subgraphs/dodoex/dodoex_polygon-graft.yaml",
    "deploy:dodo:dodoex_polygon":
      "cp ./src/mappings/constant-polygon.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_polygon.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-v2-polygon subgraphs/dodoex/dodoex_polygon.yaml",
    "deploy:studio:dodoex_polygon":
      "cp ./src/mappings/constant-polygon.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_polygon-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex-v2-polygon subgraphs/dodoex/dodoex_polygon-graft.yaml",
    "deploy:dodoex:bsc": "--------------------------------------",
    "deploy:dodoex_bsc":
      "cp ./src/mappings/constant-bsc.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_bsc.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-bsc subgraphs/dodoex/dodoex_bsc.yaml",
    "deploy:dodoex_bsc_alpha":
      "cp ./src/mappings/constant-bsc.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_bsc-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-bsc-alpha subgraphs/dodoex/dodoex_bsc-graft.yaml",
    "deploy:dodo:dodoex_bsc":
      "cp ./src/mappings/constant-bsc.ts ./src/mappings/constant.ts &&graph codegen subgraphs/dodoex/dodoex_bsc.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-v2-bsc subgraphs/dodoex/dodoex_bsc.yaml",
    "deploy:dodoex_kovan":
      "cp ./src/mappings/constant-kovan.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_kovan.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-kovan subgraphs/dodoex/dodoex_kovan.yaml",
    "deploy:dodoex_rinkeby":
      "cp ./src/mappings/constant-rinkeby.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_rinkeby-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-rinkeby subgraphs/dodoex/dodoex_rinkeby-graft.yaml",
    "deploy:dodoex_goerli":
      "cp ./src/mappings/constant-goerli.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_goerli.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-goerli subgraphs/dodoex/dodoex_goerli.yaml",
    "deploy:dodoex_basegor":
      "cp ./src/mappings/constant-basegor.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_basegor.yaml --output-dir ./src/types/dodoex/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex_v2_basegor subgraphs/dodoex/dodoex_basegor.yaml",
    "deploy:dodoex:base": "--------------------------------------",
    "deploy:dodoex_base_mainnet":
      "cp ./src/mappings/constant-base-mainnet.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_base_mainnet.yaml --output-dir ./src/types/dodoex/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex_v2_base subgraphs/dodoex/dodoex_base_mainnet.yaml",
    "deploy:dodo:dodoex_base_mainnet":
      "cp ./src/mappings/constant-base-mainnet.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_base_mainnet.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_v2_base subgraphs/dodoex/dodoex_base_mainnet.yaml",
    "deploy:dodoex_cfx":
      "cp ./src/mappings/constant-cfx.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_cfx.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_v2_cfx subgraphs/dodoex/dodoex_cfx.yaml",
    "deploy:dodoex_scroll_alpha":
      "cp ./src/mappings/constant-scroll-alpha.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_scroll_alpha.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_v2_scroll_alpha subgraphs/dodoex/dodoex_scroll_alpha.yaml",
    "deploy:dodoex_heco":
      "cp ./src/mappings/constant-heco.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_heco.yaml --output-dir ./src/types/dodoex/ && graph deploy --node https://api.hg.network/subgraph/deploy --ipfs https://f.hg.network dodoex-v2-heco-hg/heco subgraphs/dodoex/dodoex_heco.yaml --access-token ",
    "deploy:dodoex_heco_alpha":
      "cp ./src/mappings/constant-heco.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_heco.yaml --output-dir ./src/types/dodoex/ && graph deploy --node https://api.hg.network/subgraph/deploy --ipfs https://f.hg.network dodoex-v2-heco-hg-alpha/heco subgraphs/dodoex/dodoex_heco.yaml --access-token ",
    "deploy:dodoex:mainnet": "--------------------------------------",
    "deploy:dodoex_mainnet":
      "cp ./src/mappings/constant-mainnet.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_mainnet.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2 subgraphs/dodoex/dodoex_mainnet.yaml",
    "deploy:studio:dodoex_mainnet":
      "cp ./src/mappings/constant-mainnet.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_mainnet.yaml --output-dir ./src/types/dodoex/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex-v2 subgraphs/dodoex/dodoex_mainnet.yaml",
    "deploy:dodoex_moonriver":
      "cp ./src/mappings/constant-moonriver.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_moonriver.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-moonriver subgraphs/dodoex/dodoex_moonriver.yaml",
    "deploy:dodoex_moonriver_alpha":
      "cp ./src/mappings/constant-moonriver.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_moonriver-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-moonriver-alpha subgraphs/dodoex/dodoex_moonriver-graft.yaml",
    "deploy:dodoex_boba":
      "cp ./src/mappings/constant-boba.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_boba.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-boba subgraphs/dodoex/dodoex_boba.yaml",
    "deploy:dodoex_boba_alpha":
      "cp ./src/mappings/constant-boba.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_boba-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-boba-alpha subgraphs/dodoex/dodoex_boba-graft.yaml",
    "deploy:dodoex_aurora":
      "cp ./src/mappings/constant-aurora.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_aurora.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-aurora subgraphs/dodoex/dodoex_aurora.yaml",
    "deploy:dodoex_aurora_alpha":
      "cp ./src/mappings/constant-aurora.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_aurora.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-aurora-alpha subgraphs/dodoex/dodoex_aurora.yaml",
    "deploy:dodoex_avax":
      "cp ./src/mappings/constant-avax.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_avax.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-avax subgraphs/dodoex/dodoex_avax.yaml",
    "deploy:dodoex_avax_alpha":
      "cp ./src/mappings/constant-avax.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_avax-graft.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-avax-alpha subgraphs/dodoex/dodoex_avax-graft.yaml",
    "deploy:dodoex_kcc":
      "cp ./src/mappings/constant-kcc.ts ./src/mappings/constant.ts && graph codegen subgraphs/dodoex/dodoex_kcc.yaml --output-dir ./src/types/dodoex/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-v2-kcc subgraphs/dodoex/dodoex_kcc.yaml",
    "deploy:token": "--------------------------------------",
    "deploy:token_okchain":
      "graph codegen subgraphs/token/token_okchain.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://ipfs.kkt.one --node https://graph.kkt.one/node/ dodoex/dodoex-token-okchain subgraphs/token/token_okchain.yaml",
    "deploy:token_bsc":
      "graph codegen subgraphs/token/token_bsc.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-bsc subgraphs/token/token_bsc.yaml",
    "deploy:dodo:token_bsc":
      "graph codegen subgraphs/token/token_bsc.yaml --output-dir ./src/types/token/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-token-bsc subgraphs/token/token_bsc.yaml",
    "deploy:token_rinkeby":
      "graph codegen subgraphs/token/token_rinkeby.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-rinkeby subgraphs/token/token_rinkeby.yaml",
    "deploy:token_kovan":
      "graph codegen subgraphs/token/token_kovan.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ autarkxu/dodoex-token subgraphs/token/token_kovan.yaml",
    "deploy:token_heco":
      "graph codegen subgraphs/token/token_heco.yaml --output-dir ./src/types/token/ && graph deploy --node https://api.hg.network/subgraph/deploy --ipfs https://f.hg.network dodoex-token-heco/heco subgraphs/token/token_heco.yaml --access-token ",
    "deploy:token_avax":
      "graph codegen subgraphs/token/token_avax.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-avax  subgraphs/token/token_avax.yaml",
    "deploy:token_avax_alpha":
      "graph codegen subgraphs/token/token_avax.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-avax-alpha  subgraphs/token/token_avax.yaml",
    "deploy:token:polygon": "--------------------------------------",
    "deploy:token_polygon":
      "graph codegen subgraphs/token/token_polygon.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-polygon  subgraphs/token/token_polygon.yaml",
    "deploy:studio:token_polygon":
      "graph codegen subgraphs/token/token_polygon.yaml --output-dir ./src/types/token/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex-token-polygon  subgraphs/token/token_polygon.yaml",
    "deploy:dodo:token_polygon":
      "graph codegen subgraphs/token/token_polygon.yaml --output-dir ./src/types/token/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-token-polygon  subgraphs/token/token_polygon.yaml",
    "deploy:token_arbitrum":
      "graph codegen subgraphs/token/token_arbitrum.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-arbitrum  subgraphs/token/token_arbitrum.yaml",
    "deploy:token_goerli":
      "graph codegen subgraphs/token/token_goerli.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-goerli  subgraphs/token/token_goerli.yaml",
    "deploy:token_basegor":
      "graph codegen subgraphs/token/token_basegor.yaml --output-dir ./src/types/token/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex_token_basegor  subgraphs/token/token_basegor.yaml",
    "deploy:token_base_mainnet":
      "graph codegen subgraphs/token/token_base_mainnet.yaml --output-dir ./src/types/token/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex_token_base subgraphs/token/token_base_mainnet.yaml",
    "deploy:token_cfx":
      "graph codegen subgraphs/token/token_cfx.yaml --output-dir ./src/types/token/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_token_cfx subgraphs/token/token_cfx.yaml",
    "deploy:token_scroll_alpha":
      "graph codegen subgraphs/token/token_scroll_alpha.yaml --output-dir ./src/types/token/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_token_scroll_alpha subgraphs/token/token_scroll_alpha.yaml",
    "deploy:token_arbitrum_rinkeby":
      "graph codegen subgraphs/token/token_arbitrum_rinkeby.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-arbitrum-rinkeby  subgraphs/token/token_arbitrum_rinkeby.yaml",
    "deploy:token_optimism":
      "graph codegen subgraphs/token/token_optimism.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-optimism  subgraphs/token/token_optimism.yaml",
    "deploy:token_arbitrum_alpha":
      "graph codegen subgraphs/token/token_arbitrum.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-arbitrum-alpha  subgraphs/token/token_arbitrum.yaml",
    "deploy:token_mainnet":
      "graph codegen subgraphs/token/token_mainnet.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token subgraphs/token/token_mainnet.yaml",
    "deploy:dodo:token_mainnet":
      "graph codegen subgraphs/token/token_mainnet.yaml --output-dir ./src/types/token/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-token subgraphs/token/token_mainnet.yaml",
    "deploy:token_moonbeam":
      "graph codegen subgraphs/token/token_moonbeam.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-moonbeam subgraphs/token/token_moonbeam.yaml",
    "deploy:token_moonriver":
      "graph codegen subgraphs/token/token_moonriver.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-moonriver subgraphs/token/token_moonriver.yaml",
    "deploy:token_moonbeam_alpha":
      "graph codegen subgraphs/token/token_moonbeam.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-moonbeam-alpha subgraphs/token/token_moonbeam.yaml",
    "deploy:token_boba":
      "graph codegen subgraphs/token/token_boba.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-boba subgraphs/token/token_boba.yaml",
    "deploy:token_aurora":
      "graph codegen subgraphs/token/token_aurora.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-aurora subgraphs/token/token_aurora.yaml",
    "deploy:token_kcc":
      "graph codegen subgraphs/token/token_kcc.yaml --output-dir ./src/types/token/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-token-kcc  subgraphs/token/token_kcc.yaml",
    "deploy:dodomine": "--------------------------------------",
    "deploy:dodomine_rinkeby":
      "graph codegen subgraphs/mine/mine_rinkeby.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodomine-rinkeby subgraphs/mine/mine_rinkeby.yaml",
    "deploy:dodomine_mainnet":
      "graph codegen subgraphs/mine/mine_mainnet.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-mine-v3 subgraphs/mine/mine_mainnet.yaml",
    "deploy:dodo:dodomine_mainnet":
      "graph codegen subgraphs/mine/mine_mainnet.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3 subgraphs/mine/mine_mainnet.yaml",
    "deploy:dodomine_polygon":
      "graph codegen subgraphs/mine/mine_polygon.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-polygon subgraphs/mine/mine_polygon.yaml",
    "deploy:studio:dodomine_polygon":
      "graph codegen subgraphs/mine/mine_polygon.yaml --output-dir ./src/types/mine/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex-mine-v3-polygon subgraphs/mine/mine_polygon.yaml",
    "deploy:dodo:dodomine_polygon":
      "graph codegen subgraphs/mine/mine_polygon.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-mine-v3-polygon subgraphs/mine/mine_polygon.yaml",
    "deploy:dodomine_arbitrum":
      "graph codegen subgraphs/mine/mine_arbitrum.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-arbitrum subgraphs/mine/mine_arbitrum.yaml",
    "deploy:dodo:dodomine_arbitrum":
      "graph codegen subgraphs/mine/mine_arbitrum.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-mine-v3-arbitrum subgraphs/mine/mine_arbitrum.yaml",
    "deploy:dodomine_goerli":
      "graph codegen subgraphs/mine/mine_goerli.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-goerli subgraphs/mine/mine_goerli.yaml",
    "deploy:dodomine_basegor":
      "graph codegen subgraphs/mine/mine_basegor.yaml --output-dir ./src/types/mine/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex_mine_v3_basegor subgraphs/mine/mine_basegor.yaml",
    "deploy:dodomine_base_mainnet":
      "graph codegen subgraphs/mine/mine_base_mainnet.yaml --output-dir ./src/types/mine/ && graph deploy --studio --node https://api.studio.thegraph.com/deploy/ dodoex_mine_v3_base subgraphs/mine/mine_base_mainnet.yaml",
    "deploy:dodomine_cfx":
      "graph codegen subgraphs/mine/mine_cfx.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_mine_v3_cfx subgraphs/mine/mine_cfx.yaml",
    "deploy:dodomine_scroll_alpha":
      "graph codegen subgraphs/mine/mine_scroll_alpha.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex_mine_v3_scroll_alpha subgraphs/mine/mine_scroll_alpha.yaml",
    "deploy:dodomine_arbitrum_rinkeby":
      "graph codegen subgraphs/mine/mine_arbitrum_rinkeby.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-arbitrum-rinkeby subgraphs/mine/mine_arbitrum_rinkeby.yaml",
    "deploy:dodomine_bsc":
      "graph codegen subgraphs/mine/mine_bsc.yaml --output-dir ./src/types/mine/ && graph deploy --node  https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ dodoex/dodoex-mine-v3-bsc subgraphs/mine/mine_bsc.yaml",
    "deploy:dodo:dodomine_bsc":
      "graph codegen subgraphs/mine/mine_bsc.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex-mine-v3-bsc/bsc subgraphs/mine/mine_bsc.yaml --access-token",
    "deploy:dodomine_heco":
      "graph codegen subgraphs/mine/mine_heco.yaml --output-dir ./src/types/mine/ && graph deploy --node https://api.hg.network/subgraph/deploy --ipfs https://f.hg.network dodoex-mine-v3-heco/heco subgraphs/mine/mine_heco.yaml --access-token ",
    "deploy:dodomine_okchain":
      "graph codegen subgraphs/mine/mine_okchain.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://ipfs.kkt.one --node https://graph.kkt.one/node/ dodoex/dodoex-mine-v3-okchain subgraphs/mine/mine_okchain.yaml",
    "deploy:dodomine_moonriver":
      "graph codegen subgraphs/mine/mine_moonriver.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-moonriver subgraphs/mine/mine_moonriver.yaml",
    "deploy:dodomine_boba":
      "graph codegen subgraphs/mine/mine_boba.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-boba subgraphs/mine/mine_boba.yaml",
    "deploy:dodomine_aurora":
      "graph codegen subgraphs/mine/mine_aurora.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-aurora subgraphs/mine/mine_aurora.yaml",
    "deploy:dodomine_avax":
      "graph codegen subgraphs/mine/mine_avax.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-avax subgraphs/mine/mine_avax.yaml",
    "deploy:dodomine_optimism":
      "graph codegen subgraphs/mine/mine_optimism.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-optimism subgraphs/mine/mine_optimism.yaml",
    "deploy:dodomine_kcc":
      "graph codegen subgraphs/mine/mine_kcc.yaml --output-dir ./src/types/mine/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-mine-v3-kcc subgraphs/mine/mine_kcc.yaml",
  };
  const config2 = {
    "deploy:vdodo": "--------------------------------------",
    "deploy:vdodo_bsc":
      "graph codegen subgraphs/vdodo/vdodo_bsc.yaml --output-dir ./src/types/vdodo/ && graph deploy ---ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-vdodo-bsc subgraphs/vdodo/vdodo_bsc.yaml",
    "deploy:vdodo_kovan":
      "graph codegen subgraphs/vdodo/vdodo_kovan.yaml --output-dir ./src/types/vdodo/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/vdodo-kovan subgraphs/vdodo/vdodo_kovan.yaml",
    "deploy:vdodo_rinkeby":
      "graph codegen subgraphs/vdodo/vdodo_rinkeby.yaml --output-dir ./src/types/vdodo/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-vdodo-rinkeby subgraphs/vdodo/vdodo_rinkeby.yaml",
    "deploy:vdodo_mainnet":
      "graph codegen subgraphs/vdodo/vdodo_mainnet.yaml --output-dir ./src/types/vdodo/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-vdodo subgraphs/vdodo/vdodo_mainnet.yaml",
    "deploy:vdodo_mainnet_alpha":
      "graph codegen subgraphs/vdodo/vdodo_mainnet.yaml --output-dir ./src/types/vdodo/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-vdodo-alpha subgraphs/vdodo/vdodo_mainnet.yaml",
    "deploy:dodo:vdodo_mainnet":
      "graph codegen subgraphs/vdodo/vdodo_mainnet.yaml --output-dir ./src/types/vdodo/ && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 dodoex/dodoex-vdodo-beta subgraphs/vdodo/vdodo_mainnet.yaml",
    "deploy:nft": "--------------------------------------",
    "deploy:nft_kovan":
      "graph codegen subgraphs/nft/nft_kovan.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ autarkxu/dodo-nft subgraphs/nft/nft_kovan.yaml",
    "deploy:nft_rinkeby":
      "graph codegen subgraphs/nft/nft_rinkeby.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-nft-rinkeby subgraphs/nft/nft_rinkeby.yaml",
    "deploy:nft_bsc_alpha":
      "graph codegen subgraphs/nft/nft_bsc-graft.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-nft-bsc-alpha subgraphs/nft/nft_bsc-graft.yaml",
    "deploy:nft_bsc":
      "graph codegen subgraphs/nft/nft_bsc.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-nft-bsc subgraphs/nft/nft_bsc.yaml",
    "deploy:nft_mainnet":
      "graph codegen subgraphs/nft/nft_mainnet.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-nft subgraphs/nft/nft_mainnet.yaml",
    "deploy:nft_rinkeby_test":
      "graph codegen subgraphs/nft/nft_rinkeby.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ autarkxu/nft_test_06 subgraphs/nft/nft_rinkeby.yaml",
    "deploy:dodo_topia": "--------------------------------------",
    "deploy:dodo_topia_goerli":
      "graph codegen subgraphs/nft/dodo_topia_goerli.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo_topia_goerli subgraphs/nft/dodo_topia_goerli.yaml",
    "deploy:dodo_topia_mainnet":
      "graph codegen subgraphs/nft/dodo_topia_mainnet.yaml --output-dir ./src/types/nft/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo_topia_mainnet subgraphs/nft/dodo_topia_mainnet.yaml",
    "deploy:avatar": "--------------------------------------",
    "deploy:avatar_rinkeby":
      "graph codegen subgraphs/avatar/avatar_rinkeby.yaml --output-dir ./src/types/avatar/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-avatar-rinkeby subgraphs/avatar/avatar_rinkeby.yaml",
    "deploy:avatar_bsc":
      "graph codegen subgraphs/avatar/avatar_bsc.yaml --output-dir ./src/types/avatar/ && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-avatar-bsc subgraphs/avatar/avatar_bsc.yaml",
    "deploy:dodo_nft_balance_bsc":
      "graph codegen subgraphs/tools/dodoNftBalance/nft_bsc.yaml --output-dir ./src/types/tools/  && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodo-nft-balance-bsc subgraphs/tools/dodoNftBalance/nft_bsc.yaml",
    "deploy:dodo_starter": "--------------------------------------",
    "deploy:dodo_starter_goerli":
      "graph codegen subgraphs/starter/starter_goerli.yaml --output-dir ./src/types/starter/  && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-starter-goerli subgraphs/starter/starter_goerli.yaml",
    "deploy:dodo_starter_rinkeby":
      "graph codegen subgraphs/starter/starter_rinkeby.yaml --output-dir ./src/types/starter/  && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-starter-rinkeby subgraphs/starter/starter_rinkeby.yaml",
    "deploy:dodo_starter_bsc":
      "graph codegen subgraphs/starter/starter_bsc.yaml --output-dir ./src/types/starter/  && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-starter-bsc subgraphs/starter/starter_bsc.yaml",
    "deploy:dodo_starter_arbitrum":
      "graph codegen subgraphs/starter/starter_arbitrum.yaml --output-dir ./src/types/starter/  && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-starter-arbitrum subgraphs/starter/starter_arbitrum.yaml",
    "deploy:dodo_starter_polygon":
      "graph codegen subgraphs/starter/starter_polygon.yaml --output-dir ./src/types/starter/  && graph deploy --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/ dodoex/dodoex-starter-polygon subgraphs/starter/starter_polygon.yaml",
  };
  return config2;
}
