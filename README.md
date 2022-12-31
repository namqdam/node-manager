# REFRESH TOOL FOR FLUXNODE OPERATORS

## How to run

- Fork this repository.
- Change flux.example.json in `data` directory to your nodes' information.

```
proxyHost: Your Promox machine's public IP
proxyUsername: Username to Promox machine
proxyPassword: Password to Promox machine
nodeHost: Your node's internal IP (usually 192.168.xxx.xxx)
nodeUsername: Username to node machine
nodePassword: Password to node machine

If you have many node, the content should be
{
  "nodes": [
    {
      // first node info
    },
    {
      // second node info and so on
    }
  ]
}
```

- Copy this content and open a browser console.

- Type in `btoa(JSON.stringify(content_filled_here))` and press ENTER.

![btoa](https://raw.githubusercontent.com/namqdam/node-manager/master/images/btoa.png)

- Copy the result and create repository secret with name `DATA`.

![secret](https://raw.githubusercontent.com/namqdam/node-manager/master/images/secret.png)

- Make some change to your [cron job](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) to prevent many nodes be down at a same time, e.g. from `'0 19 * * 6'` to `'0 0 * * 1'` for running at 00:00 every Monday.

![cron](https://raw.githubusercontent.com/namqdam/node-manager/master/images/cron.png)

- You can trigger this workflow manually or it will runs on schedule above.

![secret](https://raw.githubusercontent.com/namqdam/node-manager/master/images/workflow.png)

## How it works

The base64 DATA (from secret) will be parsed in to readable content. Then the script will connect to your node using [jump hosts](https://en.wikibooks.org/wiki/OpenSSH/Cookbook/Proxies_and_Jump_Hosts) method, and run the script `sudo apt-get update -y && sudo apt-get --with-new-pkgs upgrade -y && sudo apt autoremove -y && cd zelflux && git checkout . && git checkout master && git reset && git pull && echo FINISHED && sudo reboot`.

## Planed

- Refresh standalone node.

## Any donations are welcomed and appreciated. Thanks.

```
FLUX: t1cRR4dXvt1BdZBXiGza3KZJJ3VsfUezjvn
ETH: 0x0c65c76020f54ffb74c6b02c069df4b1d9e42442
BNB: 0x0c65c76020f54ffb74c6b02c069df4b1d9e42442
```

## Social

- [Follow me on Twitter](https://twitter.com/nam_blockquests)
- [Contact me on Discord](https://discordapp.com/users/7157139300095099100)
