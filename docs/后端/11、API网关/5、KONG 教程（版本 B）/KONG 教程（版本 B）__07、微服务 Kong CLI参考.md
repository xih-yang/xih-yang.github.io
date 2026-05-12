# 07、微服务 Kong CLI参考
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/7.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
KONG提供了一套CLI（命令行界面）命令，您可以通过它来启动、停止和管理您的Kong实例。CLI管理您的本地节点（如在当前机器上）。

## 全局配置

所有命令都采用一组指定的可选标志作为参数：

--help：显示命令行帮助信息

--v：启动详情模式

--vv：启动debug模式(noisy)

## 可用的命令符

kong check:

```sh
Usage: kong check <conf>
Check the validity of a given Kong configuration file.
<conf> (default /etc/kong.conf) configuration file
```

## kong cluster:

```sh
Usage: kong cluster COMMAND [OPTIONS]
Manage Kong's clustering capabilities.
The available commands are:
  keygen -c                   Generate an encryption key for intracluster traffic.
                              See 'cluster_encrypt_key' setting
  members -p                  Show members of this cluster and their state.
  reachability -p             Check if the cluster is reachable.
  force-leave -p <node_name>  Forcefully remove a node from the cluster (useful
                              if the node is in a failed state).
  keys install <key>          Install a new key onto Kong's internal keyring. This
                              will enable the key for decryption. The key will not
                              be used to encrypt messages until the primary key is
                              changed.
  keys use <key>              Change the primary key used for encrypting messages.
                              All nodes in the cluster must already have this key
                              installed if they are to continue communicating with
                              eachother.
  keys remove <key>           Remove a key from Kong's internal keyring. The key
                              being removed may not be the current primary key.
  keys list                   List all currently known keys in the cluster. This
                              will ask all nodes in the cluster for a list of keys
                              and dump a summary containing each key and the
                              number of members it is installed on to the console.
Options:
  -c,--conf   (optional string) configuration file
  -p,--prefix (optional string) prefix Kong is running at
```

## kong compile:

```sh
Usage: kong compile [OPTIONS]
Compile the Nginx configuration file containing Kong's servers
contexts from a given Kong configuration file.
Example usage:
  kong compile -c kong.conf > /usr/local/openresty/nginx-kong.conf
  This file can then be included in an OpenResty configuration:
  http {
      # ...
      include 'nginx-kong.conf';
  }
Note:
  Third-party services such as Serf need to be properly configured
  and started for Kong to be fully compatible while embedded.
Options:
  -c,--conf (optional string) configuration file
```

## kong health:

```sh
Usage: kong health [OPTIONS]
Check if the necessary services are running for this node.
Options:
  -p,--prefix (optional string) prefix at which Kong should be running
```

## kong migrations:

```sh
Usage: kong migrations COMMAND [OPTIONS]
Manage Kong's database migrations.
The available commands are:
  list   List migrations currently executed.
  up     Execute all missing migrations up to the latest available.
  reset  Reset the configured database (irreversible).
Options:
  -c,--conf (optional string) configuration file
```

## kong quit:

```sh
Usage: kong quit [OPTIONS]
Gracefully quit a running Kong node (Nginx and other
configured services) in given prefix directory.
This command sends a SIGQUIT signal to Nginx, meaning all
requests will finish processing before shutting down.
If the timeout delay is reached, the node will be forcefully
stopped (SIGTERM).
Options:
  -p,--prefix  (optional string) prefix Kong is running at
  -t,--timeout (default 10) timeout before forced shutdown
```

## kong reload:

```sh
Usage: kong reload [OPTIONS]
Reload a Kong node (and start other configured services
if necessary) in given prefix directory.
This command sends a HUP signal to Nginx, which will spawn
new workers (taking configuration changes into account),
and stop the old ones when they have finished processing
current requests.
Options:
  -c,--conf    (optional string) configuration file
  -p,--prefix  (optional string) prefix Kong is running at
  --nginx-conf (optional string) custom Nginx configuration template
```

## kong restart:

```sh
Usage: kong restart [OPTIONS]
Restart a Kong node (and other configured services like Serf)
in the given prefix directory.
This command is equivalent to doing both 'kong stop' and
'kong start'.
Options:
  -c,--conf    (optional string) configuration file
  -p,--prefix  (optional string) prefix at which Kong should be running
  --nginx-conf (optional string) custom Nginx configuration template
```

## kong start:

```sh
Usage: kong start [OPTIONS]
Start Kong (Nginx and other configured services) in the configured
prefix directory.
Options:
  -c,--conf    (optional string) configuration file
  -p,--prefix  (optional string) override prefix directory
  --nginx-conf (optional string) custom Nginx configuration template
```

## kong stop:

```sh
Usage: kong stop [OPTIONS]
Stop a running Kong node (Nginx and other configured services) in given
prefix directory.
This command sends a SIGTERM signal to Nginx.
Options:
  -p,--prefix (optional string) prefix Kong is running at
```

## kong version:

```sh
Usage: kong version [OPTIONS]
Print Kong's version. With the -a option, will print
the version of all underlying dependencies.
Options:
  -a,--all    get version of all dependencies
```

- --help: print the command's help message

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
