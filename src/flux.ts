import fse from 'fs-extra';
import path from 'path';
import ssh2 from 'ssh2';

interface FluxNode {
  proxyHost: string;
  proxyUsername: string;
  proxyPassword: string;
  nodeHost: string;
  nodeUsername: string;
  nodePassword: string;
}

function parseData(data: string): FluxNode[] {
  try {
    const { nodes } = JSON.parse(data) as { nodes: FluxNode[] };
    return nodes;
  } catch (error) {
    console.log(error);
    return [];
  }
}

function refreshNode(node: FluxNode) {
  const baseConn = new ssh2.Client();
  const conn = new ssh2.Client();

  return new Promise<void>((resolve, reject) => {
    baseConn
      .on('error', console.log)
      .on('ready', () => {
        console.log(`PROXY ${node.proxyHost} :: connection ready`);
        baseConn.forwardOut('127.0.0.1', 8080, node.nodeHost, 22, (err, stream) => {
          if (err) {
            console.log('PROXY :: forwardOut error: ' + err);
            reject(err);
            baseConn.end();
          }
          conn.connect({
            sock: stream,
            host: node.nodeHost,
            username: node.nodeUsername,
            password: node.nodePassword,
            port: 22,
            keepaliveInterval: 0,
            keepaliveCountMax: 1,
          });
        });
      })
      .connect({
        host: node.proxyHost,
        username: node.proxyUsername,
        password: node.proxyPassword,
        port: 22,
        keepaliveInterval: 0,
        keepaliveCountMax: 1,
      });

    conn.on('error', console.log).on('ready', function () {
      console.log(`NODE ${node.nodeHost} :: connection ready`);
      conn.shell((err, stream) => {
        if (err) {
          console.log('SECOND :: shell error: ' + err);
          conn.end();
          baseConn.end();
          reject(err);
        }
        stream
          .on('error', (err) => {
            console.log('ERROR :: ', err);
          })
          .on('close', () => {
            console.log('Stream :: close');
            baseConn.end();
            resolve();
          })
          .on('data', (data: Buffer) => {
            console.log('OUTPUT :: ' + data);
            if (data.indexOf('FINISHED') === 0) {
              conn.end();
            }
          });
        stream.end(
          'sudo apt-get update -y && sudo apt-get --with-new-pkgs upgrade -y && sudo apt autoremove -y && cd zelflux && git checkout . && git checkout master && git reset && git pull && echo FINISHED && sudo reboot\n'
        );
      });
    });
  });
}

export async function manageFlux() {
  const filePath = path.resolve('data', 'flux.json');
  if (!fse.existsSync(filePath)) return;

  const data = fse.readFileSync(filePath, { encoding: 'utf-8' });
  const nodes = parseData(data);
  for (const node of nodes) {
    try {
      await refreshNode(node);
    } catch (error) {
      console.log(error);
    }
  }
  console.log('FINISHED');
}
