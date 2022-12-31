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

function refresh(node: FluxNode) {
  const baseConn = new ssh2.Client();
  const conn = new ssh2.Client();

  return new Promise<void>((resolve, reject) => {
    baseConn
      .on('error', console.log)
      .on('ready', () => {
        baseConn.forwardOut('127.0.0.1', 8080, node.nodeHost, 22, (err, stream) => {
          if (err) {
            console.log(`PROXY :: forwardOut error: ${err}`);
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
      conn.shell((err, stream) => {
        if (err) {
          console.log(`NODE :: shell error: ${err}`);
          conn.end();
          baseConn.end();
          reject(err);
        }
        stream
          .on('error', (err) => {
            console.log('ERROR :: ', err);
          })
          .on('close', () => {
            console.log('STREAM :: close');
            baseConn.end();
            resolve();
          })
          .on('data', (data: Buffer) => {
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

function maskHost(host: string, excludeIndexes: number[]) {
  const parts = host.split('.');
  const makeX = (index: number) => {
    if (excludeIndexes.indexOf(index) > -1) return parts[index];
    return parts[index].replace(/./g, '*');
  };

  if (parts.length !== 4) return '';
  return `${makeX(0)}.${makeX(1)}.${makeX(2)}.${makeX(3)}`;
}

export async function manageFlux(data: string) {
  const nodes = parseData(data);
  for (const [index, node] of nodes.entries()) {
    try {
      console.log(`Working on index ${index} node ${maskHost(node.nodeHost, [3])}`);
      await refresh(node);
    } catch (error) {
      console.log(`Item at index ${index} has error ${error}`);
    }
  }
}
