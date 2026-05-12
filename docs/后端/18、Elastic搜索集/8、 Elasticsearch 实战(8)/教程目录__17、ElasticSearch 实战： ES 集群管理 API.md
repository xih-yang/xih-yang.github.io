# 17、ElasticSearch 实战： ES 集群管理 API
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/17.html
- 分类：搜索引擎
- 分组：教程目录
本章节要介绍的这些 API 用于获取有关集群及其节点的信息，并且可以对集群进行更改

调用这些 API 时，我们需要指定节点的名称、地址或使用 _local 路径参数

例如下面的请求

```java
GET http://localhost:9200/_nodes/_local
```

会返回本地集群的信息

```java
{
    "_nodes": {
        "total": 1,
        "successful": 1,
        "failed": 0
    },
    "cluster_name": "elasticsearch",
    "nodes": {
        "4zwAMlTzRCaioBeOE9PaNw": {
            "name": "4zwAMlT",
            "transport_address": "127.0.0.1:9300",
            "host": "127.0.0.1",
            "ip": "127.0.0.1",
            "version": "6.3.0",
            "build_flavor": "default",
            "build_type": "zip",
            "build_hash": "424e937",
            "total_indexing_buffer": 103887667,
            "roles": [
                "master",
                "data",
                "ingest"
            ],
            "attributes": {
                "ml.machine_memory": "4294967296",
                "xpack.installed": "true",
                "ml.max_open_jobs": "20",
                "ml.enabled": "true"
            },
            "settings": {
                "client": {
                    "type": "node"
                },
                "cluster": {
                    "name": "elasticsearch"
                },
                "http": {
                    "type": "security4",
                    "type.default": "netty4"
                },
                "node": {
                    "attr": {
                        "xpack": {
                            "installed": "true"
                        },
                        "ml": {
                            "machine_memory": "4294967296",
                            "max_open_jobs": "20",
                            "enabled": "true"
                        }
                    },
                    "name": "4zwAMlT"
                },
                "path": {
                    "logs": "/usr/local/elasticsearch/6.3.0/logs",
                    "home": "/usr/local/elasticsearch/6.3.0"
                },
                "transport": {
                    "type": "security4",
                    "features": {
                        "x-pack": "true"
                    },
                    "type.default": "netty4"
                }
            },
            "os": {
                "refresh_interval_in_millis": 1000,
                "name": "Mac OS X",
                "arch": "x86_64",
                "version": "10.13.5",
                "available_processors": 4,
                "allocated_processors": 4
            },
            "process": {
                "refresh_interval_in_millis": 1000,
                "id": 33621,
                "mlockall": false
            },
            "jvm": {
                "pid": 33621,
                "version": "1.8.0_101",
                "vm_name": "Java HotSpot(TM) 64-Bit Server VM",
                "vm_version": "25.101-b13",
                "vm_vendor": "Oracle Corporation",
                "start_time_in_millis": 1530181150844,
                "mem": {
                    "heap_init_in_bytes": 1073741824,
                    "heap_max_in_bytes": 1038876672,
                    "non_heap_init_in_bytes": 2555904,
                    "non_heap_max_in_bytes": 0,
                    "direct_max_in_bytes": 1038876672
                },
                "gc_collectors": [
                    "ParNew",
                    "ConcurrentMarkSweep"
                ],
                "memory_pools": [
                    "Code Cache",
                    "Metaspace",
                    "Compressed Class Space",
                    "Par Eden Space",
                    "Par Survivor Space",
                    "CMS Old Gen"
                ],
                "using_compressed_ordinary_object_pointers": "true",
                "input_arguments": [
                    "-Xms1g",
                    "-Xmx1g",
                    "-XX:+UseConcMarkSweepGC",
                    "-XX:CMSInitiatingOccupancyFraction=75",
                    "-XX:+UseCMSInitiatingOccupancyOnly",
                    "-XX:+AlwaysPreTouch",
                    "-Xss1m",
                    "-Djava.awt.headless=true",
                    "-Dfile.encoding=UTF-8",
                    "-Djna.nosys=true",
                    "-XX:-OmitStackTraceInFastThrow",
                    "-Dio.netty.noUnsafe=true",
                    "-Dio.netty.noKeySetOptimization=true",
                    "-Dio.netty.recycler.maxCapacityPerThread=0",
                    "-Dlog4j.shutdownHookEnabled=false",
                    "-Dlog4j2.disable.jmx=true",
                    "-Djava.io.tmpdir=/var/folders/yk/2446sljj6hn82nvzkdgxltmw0000gn/T/elasticsearch.PbjUEM9C",
                    "-XX:+HeapDumpOnOutOfMemoryError",
                    "-XX:HeapDumpPath=data",
                    "-XX:ErrorFile=logs/hs_err_pid%p.log",
                    "-XX:+PrintGCDetails",
                    "-XX:+PrintGCDateStamps",
                    "-XX:+PrintTenuringDistribution",
                    "-XX:+PrintGCApplicationStoppedTime",
                    "-Xloggc:logs/gc.log",
                    "-XX:+UseGCLogFileRotation",
                    "-XX:NumberOfGCLogFiles=32",
                    "-XX:GCLogFileSize=64m",
                    "-Des.path.home=/usr/local/elasticsearch/6.3.0",
                    "-Des.path.conf=/usr/local/elasticsearch/6.3.0/config",
                    "-Des.distribution.flavor=default",
                    "-Des.distribution.type=zip"
                ]
            },
            "thread_pool": {
                "watcher": {
                    "type": "fixed",
                    "min": 20,
                    "max": 20,
                    "queue_size": 1000
                },
                "force_merge": {
                    "type": "fixed",
                    "min": 1,
                    "max": 1,
                    "queue_size": -1
                },
                "security-token-key": {
                    "type": "fixed",
                    "min": 1,
                    "max": 1,
                    "queue_size": 1000
                },
                "ml_datafeed": {
                    "type": "fixed",
                    "min": 20,
                    "max": 20,
                    "queue_size": 200
                },
                "fetch_shard_started": {
                    "type": "scaling",
                    "min": 1,
                    "max": 8,
                    "keep_alive": "5m",
                    "queue_size": -1
                },
                "listener": {
                    "type": "fixed",
                    "min": 2,
                    "max": 2,
                    "queue_size": -1
                },
                "ml_autodetect": {
                    "type": "fixed",
                    "min": 80,
                    "max": 80,
                    "queue_size": 80
                },
                "index": {
                    "type": "fixed",
                    "min": 4,
                    "max": 4,
                    "queue_size": 200
                },
                "refresh": {
                    "type": "scaling",
                    "min": 1,
                    "max": 2,
                    "keep_alive": "5m",
                    "queue_size": -1
                },
                "generic": {
                    "type": "scaling",
                    "min": 4,
                    "max": 128,
                    "keep_alive": "30s",
                    "queue_size": -1
                },
                "rollup_indexing": {
                    "type": "fixed",
                    "min": 4,
                    "max": 4,
                    "queue_size": 4
                },
                "warmer": {
                    "type": "scaling",
                    "min": 1,
                    "max": 2,
                    "keep_alive": "5m",
                    "queue_size": -1
                },
                "search": {
                    "type": "fixed_auto_queue_size",
                    "min": 7,
                    "max": 7,
                    "queue_size": 1000
                },
                "flush": {
                    "type": "scaling",
                    "min": 1,
                    "max": 2,
                    "keep_alive": "5m",
                    "queue_size": -1
                },
                "fetch_shard_store": {
                    "type": "scaling",
                    "min": 1,
                    "max": 8,
                    "keep_alive": "5m",
                    "queue_size": -1
                },
                "management": {
                    "type": "scaling",
                    "min": 1,
                    "max": 5,
                    "keep_alive": "5m",
                    "queue_size": -1
                },
                "ml_utility": {
                    "type": "fixed",
                    "min": 80,
                    "max": 80,
                    "queue_size": 500
                },
                "get": {
                    "type": "fixed",
                    "min": 4,
                    "max": 4,
                    "queue_size": 1000
                },
                "analyze": {
                    "type": "fixed",
                    "min": 1,
                    "max": 1,
                    "queue_size": 16
                },
                "write": {
                    "type": "fixed",
                    "min": 4,
                    "max": 4,
                    "queue_size": 200
                },
                "snapshot": {
                    "type": "scaling",
                    "min": 1,
                    "max": 2,
                    "keep_alive": "5m",
                    "queue_size": -1
                }
            },
            "transport": {
                "bound_address": [
                    "[::1]:9300",
                    "127.0.0.1:9300"
                ],
                "publish_address": "127.0.0.1:9300",
                "profiles": {}
            },
            "http": {
                "bound_address": [
                    "[::1]:9200",
                    "127.0.0.1:9200"
                ],
                "publish_address": "127.0.0.1:9200",
                "max_content_length_in_bytes": 104857600
            },
            "plugins": [
                {
                    "name": "analysis-jieba",
                    "version": "6.0.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "A jieba analysis of plugins for Elasticsearch",
                    "classname": "org.elasticsearch.plugin.analysis.jieba.AnalysisJiebaPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                }
            ],
            "modules": [
                {
                    "name": "aggs-matrix-stats",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Adds aggregations whose input are a list of numeric fields and output includes a matrix.",
                    "classname": "org.elasticsearch.search.aggregations.matrix.MatrixAggregationPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "analysis-common",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Adds \"built in\" analyzers to Elasticsearch.",
                    "classname": "org.elasticsearch.analysis.common.CommonAnalysisPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "ingest-common",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Module for ingest processors that do not require additional security permissions or have large dependencies and resources",
                    "classname": "org.elasticsearch.ingest.common.IngestCommonPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "lang-expression",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Lucene expressions integration for Elasticsearch",
                    "classname": "org.elasticsearch.script.expression.ExpressionPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "lang-mustache",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Mustache scripting integration for Elasticsearch",
                    "classname": "org.elasticsearch.script.mustache.MustachePlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "lang-painless",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "An easy, safe and fast scripting language for Elasticsearch",
                    "classname": "org.elasticsearch.painless.PainlessPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "mapper-extras",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Adds advanced field mappers",
                    "classname": "org.elasticsearch.index.mapper.MapperExtrasPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "parent-join",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "This module adds the support parent-child queries and aggregations",
                    "classname": "org.elasticsearch.join.ParentJoinPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "percolator",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Percolator module adds capability to index queries and query these queries by specifying documents",
                    "classname": "org.elasticsearch.percolator.PercolatorPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "rank-eval",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "The Rank Eval module adds APIs to evaluate ranking quality.",
                    "classname": "org.elasticsearch.index.rankeval.RankEvalPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "reindex",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "The Reindex module adds APIs to reindex from one index to another or update documents in place.",
                    "classname": "org.elasticsearch.index.reindex.ReindexPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "repository-url",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Module for URL repository",
                    "classname": "org.elasticsearch.plugin.repository.url.URLRepositoryPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "transport-netty4",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Netty 4 based transport implementation",
                    "classname": "org.elasticsearch.transport.Netty4Plugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "tribe",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Tribe module",
                    "classname": "org.elasticsearch.tribe.TribePlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-core",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Core",
                    "classname": "org.elasticsearch.xpack.core.XPackPlugin",
                    "extended_plugins": [],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-deprecation",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Deprecation",
                    "classname": "org.elasticsearch.xpack.deprecation.Deprecation",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-graph",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Graph",
                    "classname": "org.elasticsearch.xpack.graph.Graph",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-logstash",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Logstash",
                    "classname": "org.elasticsearch.xpack.logstash.Logstash",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-ml",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Machine Learning",
                    "classname": "org.elasticsearch.xpack.ml.MachineLearning",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": true
                },
                {
                    "name": "x-pack-monitoring",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Monitoring",
                    "classname": "org.elasticsearch.xpack.monitoring.Monitoring",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-rollup",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Rollup",
                    "classname": "org.elasticsearch.xpack.rollup.Rollup",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-security",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Security",
                    "classname": "org.elasticsearch.xpack.security.Security",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-sql",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "The Elasticsearch plugin that powers SQL for Elasticsearch",
                    "classname": "org.elasticsearch.xpack.sql.plugin.SqlPlugin",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-upgrade",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Upgrade",
                    "classname": "org.elasticsearch.xpack.upgrade.Upgrade",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                },
                {
                    "name": "x-pack-watcher",
                    "version": "6.3.0",
                    "elasticsearch_version": "6.3.0",
                    "java_version": "1.8",
                    "description": "Elasticsearch Expanded Pack Plugin - Watcher",
                    "classname": "org.elasticsearch.xpack.watcher.Watcher",
                    "extended_plugins": [
                        "x-pack-core"
                    ],
                    "has_native_controller": false
                }
            ],
            "ingest": {
                "processors": [
                    {
                        "type": "append"
                    },
                    {
                        "type": "convert"
                    },
                    {
                        "type": "date"
                    },
                    {
                        "type": "date_index_name"
                    },
                    {
                        "type": "dot_expander"
                    },
                    {
                        "type": "fail"
                    },
                    {
                        "type": "foreach"
                    },
                    {
                        "type": "grok"
                    },
                    {
                        "type": "gsub"
                    },
                    {
                        "type": "join"
                    },
                    {
                        "type": "json"
                    },
                    {
                        "type": "kv"
                    },
                    {
                        "type": "lowercase"
                    },
                    {
                        "type": "remove"
                    },
                    {
                        "type": "rename"
                    },
                    {
                        "type": "script"
                    },
                    {
                        "type": "set"
                    },
                    {
                        "type": "set_security_user"
                    },
                    {
                        "type": "sort"
                    },
                    {
                        "type": "split"
                    },
                    {
                        "type": "trim"
                    },
                    {
                        "type": "uppercase"
                    },
                    {
                        "type": "urldecode"
                    }
                ]
            }
        }
    }
}
```

或者使用下面的查询返回 127.0.0. 节点的信息

```java
GET http://localhost:9200/_nodes/127.0.0.1
```

返回的内容和上面的一样

## 集群健康情况

可以在集群信息上追加 health 路径参数来查询集群的健康情况

例如下面的查询

```java
GET http://localhost:9200/_cluster/health
```

返回内容如下

```java
{
    "cluster_name": "elasticsearch",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 20,
    "active_shards": 20,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 20,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 50
}
```

## 集群状态

这个API 通过在 URL 上追加 state 路径参数来获取有关集群的状态信息

状态信息包含版本，主节点，其他节点，路由表，元数据和块

例如下面的请求

```java
GET http://localhost:9200/_cluster/state
```

响应内容如下

```java
{
    "cluster_name": "elasticsearch",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 20,
    "active_shards": 20,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 20,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 50
}
```

## 集群统计信息

此API 通过在 URL 上追加 stats 关键字来检索有关集群的统计信息

返回的内容包括分片编号，存储大小，内存使用情况，节点数，角色，操作系统和文件系统

例如下面的请求

```java
GET http://localhost:9200/_cluster/stats
```

响应内容如下

```java
json\ {
    "cluster\_name": "elasticsearch",
    "compressed\_size\_in\_bytes": 10609,
    "version": 36,
    "state\_uuid": "PZGaxwfWRomR8hnNJOiTGw",
    "master\_node": "4zwAMlTzRCaioBeOE9PaNw",
    "blocks": \{\},
    "nodes": \{
        "4zwAMlTzRCaioBeOE9PaNw": \{
            "name": "4zwAMlT",
            "ephemeral\_id": "geT2RMT0TKyYQKtrRR2lhQ",
            "transport\_address": "127.0.0.1:9300",
            "attributes": \{
                "ml.machine\_memory": "4294967296",
                "xpack.installed": "true",
                "ml.max\_open\_jobs": "20",
                "ml.enabled": "true"\
            }\
        }\
    },
    "metadata": \{
        "cluster\_uuid": "UgKKy4O-TTKrux4cHHcrZQ",
        "templates": \{
            ".monitoring-es": \{
                "index\_patterns": \[".monitoring-es-6-\*"\],
                "order": 0,
                "settings": \{
                    "index": \{
                        "format": "6",
                        "codec": "best\_compression",
                        "number\_of\_shards": "1",
                        "auto\_expand\_replicas": "0-1",
                        "number\_of\_replicas": "0"\
                    }\
                },
                "mappings": \{
                    "doc": \{
                        "dynamic": false,
                        "date\_detection": false,
                        "properties": \{
                            "interval\_ms": \{
                                "type": "long"\
                            },
                            "cluster\_state": \{
                                "properties": \{
                                    "shards": \{
                                        "type": "object"\
                                    },
                                    "nodes\_hash": \{
                                        "type": "integer"\
                                    },
                                    "nodes": \{
                                        "type": "object"\
                                    },
                                    "master\_node": \{
                                        "type": "keyword"\
                                    },
                                    "state\_uuid": \{
                                        "type": "keyword"\
                                    },
                                    "version": \{
                                        "type": "long"\
                                    },
                                    "status": \{
                                        "type": "keyword"\
                                    }\
                                }\
                            },
                            "type": \{
                                "type": "keyword"\
                            },
                            "indices\_stats": \{
                                "properties": \{
                                    "\_all": \{
                                        "properties": \{
                                            "primaries": \{
                                                "properties": \{
                                                    "search": \{
                                                        "properties": \{
                                                            "query\_total": \{
                                                                "type": "long"\
                                                            },
                                                            "query\_time\_in\_millis": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    },
                                                    "docs": \{
                                                        "properties": \{
                                                            "count": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    },
                                                    "indexing": \{
                                                        "properties": \{
                                                            "index\_time\_in\_millis": \{
                                                                "type": "long"\
                                                            },
                                                            "index\_total": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    }\
                                                }\
                                            },
                                            "total": \{
                                                "properties": \{
                                                    "search": \{
                                                        "properties": \{
                                                            "query\_total": \{
                                                                "type": "long"\
                                                            },
                                                            "query\_time\_in\_millis": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    },
                                                    "docs": \{
                                                        "properties": \{
                                                            "count": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    },
                                                    "indexing": \{
                                                        "properties": \{
                                                            "index\_time\_in\_millis": \{
                                                                "type": "long"\
                                                            },
                                                            "index\_total": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    }\
                                }\
                            },
                            "node\_stats": \{
                                "properties": \{
                                    "jvm": \{
                                        "properties": \{
                                            "mem": \{
                                                "properties": \{
                                                    "heap\_used\_percent": \{
                                                        "type": "half\_float"\
                                                    },
                                                    "heap\_max\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "heap\_used\_in\_bytes": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "gc": \{
                                                "properties": \{
                                                    "collectors": \{
                                                        "properties": \{
                                                            "young": \{
                                                                "properties": \{
                                                                    "collection\_count": \{
                                                                        "type": "long"\
                                                                    },
                                                                    "collection\_time\_in\_millis": \{
                                                                        "type": "long"\
                                                                    }\
                                                                }\
                                                            },
                                                            "old": \{
                                                                "properties": \{
                                                                    "collection\_count": \{
                                                                        "type": "long"\
                                                                    },
                                                                    "collection\_time\_in\_millis": \{
                                                                        "type": "long"\
                                                                    }\
                                                                }\
                                                            }\
                                                        }\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    },
                                    "indices": \{
                                        "properties": \{
                                            "search": \{
                                                "properties": \{
                                                    "query\_total": \{
                                                        "type": "long"\
                                                    },
                                                    "query\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "query\_cache": \{
                                                "properties": \{
                                                    "miss\_count": \{
                                                        "type": "long"\
                                                    },
                                                    "memory\_size\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "evictions": \{
                                                        "type": "long"\
                                                    },
                                                    "hit\_count": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "docs": \{
                                                "properties": \{
                                                    "count": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "fielddata": \{
                                                "properties": \{
                                                    "memory\_size\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "evictions": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "indexing": \{
                                                "properties": \{
                                                    "throttle\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    },
                                                    "index\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    },
                                                    "index\_total": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "request\_cache": \{
                                                "properties": \{
                                                    "miss\_count": \{
                                                        "type": "long"\
                                                    },
                                                    "memory\_size\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "evictions": \{
                                                        "type": "long"\
                                                    },
                                                    "hit\_count": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "store": \{
                                                "properties": \{
                                                    "size\_in\_bytes": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "segments": \{
                                                "properties": \{
                                                    "version\_map\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "norms\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "count": \{
                                                        "type": "integer"\
                                                    },
                                                    "term\_vectors\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "points\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "index\_writer\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "terms\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "doc\_values\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "stored\_fields\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "fixed\_bit\_set\_memory\_in\_bytes": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    },
                                    "process": \{
                                        "properties": \{
                                            "open\_file\_descriptors": \{
                                                "type": "long"\
                                            },
                                            "max\_file\_descriptors": \{
                                                "type": "long"\
                                            },
                                            "cpu": \{
                                                "properties": \{
                                                    "percent": \{
                                                        "type": "half\_float"\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    },
                                    "node\_master": \{
                                        "type": "boolean"\
                                    },
                                    "os": \{
                                        "properties": \{
                                            "cpu": \{
                                                "properties": \{
                                                    "load\_average": \{
                                                        "properties": \{
                                                            "5m": \{
                                                                "type": "half\_float"\
                                                            },
                                                            "15m": \{
                                                                "type": "half\_float"\
                                                            },
                                                            "1m": \{
                                                                "type": "half\_float"\
                                                            }\
                                                        }\
                                                    }\
                                                }\
                                            },
                                            "cgroup": \{
                                                "properties": \{
                                                    "memory": \{
                                                        "properties": \{
                                                            "usage\_in\_bytes": \{
                                                                "type": "keyword"\
                                                            },
                                                            "control\_group": \{
                                                                "type": "keyword"\
                                                            },
                                                            "limit\_in\_bytes": \{
                                                                "type": "keyword"\
                                                            }\
                                                        }\
                                                    },
                                                    "cpu": \{
                                                        "properties": \{
                                                            "stat": \{
                                                                "properties": \{
                                                                    "number\_of\_elapsed\_periods": \{
                                                                        "type": "long"\
                                                                    },
                                                                    "number\_of\_times\_throttled": \{
                                                                        "type": "long"\
                                                                    },
                                                                    "time\_throttled\_nanos": \{
                                                                        "type": "long"\
                                                                    }\
                                                                }\
                                                            },
                                                            "control\_group": \{
                                                                "type": "keyword"\
                                                            },
                                                            "cfs\_quota\_micros": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    },
                                                    "cpuacct": \{
                                                        "properties": \{
                                                            "control\_group": \{
                                                                "type": "keyword"\
                                                            },
                                                            "usage\_nanos": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    },
                                    "thread\_pool": \{
                                        "properties": \{
                                            "watcher": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            },
                                            "search": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            },
                                            "get": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            },
                                            "index": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            },
                                            "maanagement": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            },
                                            "bulk": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            },
                                            "generic": \{
                                                "properties": \{
                                                    "rejected": \{
                                                        "type": "long"\
                                                    },
                                                    "threads": \{
                                                        "type": "integer"\
                                                    },
                                                    "queue": \{
                                                        "type": "integer"\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    },
                                    "mlockall": \{
                                        "type": "boolean"\
                                    },
                                    "fs": \{
                                        "properties": \{
                                            "io\_stats": \{
                                                "properties": \{
                                                    "total": \{
                                                        "properties": \{
                                                            "write\_operations": \{
                                                                "type": "long"\
                                                            },
                                                            "write\_kilobytes": \{
                                                                "type": "long"\
                                                            },
                                                            "operations": \{
                                                                "type": "long"\
                                                            },
                                                            "read\_operations": \{
                                                                "type": "long"\
                                                            },
                                                            "read\_kilobytes": \{
                                                                "type": "long"\
                                                            }\
                                                        }\
                                                    }\
                                                }\
                                            },
                                            "total": \{
                                                "properties": \{
                                                    "total\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "free\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "available\_in\_bytes": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "data": \{
                                                "properties": \{
                                                    "spins": \{
                                                        "type": "boolean"\
                                                    }\
                                                }\
                                            }\
                                        }\
                                    },
                                    "node\_id": \{
                                        "type": "keyword"\
                                    }\
                                }\
                            },
                            "index\_stats": \{
                                "properties": \{
                                    "primaries": \{
                                        "properties": \{
                                            "search": \{
                                                "properties": \{
                                                    "query\_total": \{
                                                        "type": "long"\
                                                    },
                                                    "query\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "query\_cache": \{
                                                "properties": \{
                                                    "miss\_count": \{
                                                        "type": "long"\
                                                    },
                                                    "memory\_size\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "evictions": \{
                                                        "type": "long"\
                                                    },
                                                    "hit\_count": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "docs": \{
                                                "properties": \{
                                                    "count": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "fielddata": \{
                                                "properties": \{
                                                    "memory\_size\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "evictions": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "indexing": \{
                                                "properties": \{
                                                    "throttle\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    },
                                                    "index\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    },
                                                    "index\_total": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "refresh": \{
                                                "properties": \{
                                                    "total\_time\_in\_millis": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "store": \{
                                                "properties": \{
                                                    "size\_in\_bytes": \{
                                                        "type": "long"\
                                                    }\
                                                }\
                                            },
                                            "request\_cache": \{
                                                "properties": \{
                                                    "miss\_count": \{
                                                        "type": "long"\
                                                    },
                                                    "memory\_size\_in\_bytes": \{
                                                        "type": "long"\
                                                    },
                                                    "evictions": \{
                                                        "type": "long"
```
