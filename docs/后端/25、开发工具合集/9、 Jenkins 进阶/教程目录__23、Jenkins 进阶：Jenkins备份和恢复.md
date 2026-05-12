# 23、Jenkins 进阶：Jenkins备份和恢复
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/23.html
- 分类：开发工具
- 分组：教程目录
## 一、插件备份和恢复

### 1.安装备份插件

**重启系统后查看**

### 2.配置周期备份

点击进入，点击Settings

**Backup only builds marked to keep**,如果启用此选项，则仅备份标记为“永久保留此生成”的生成结果/项目。如下图

**Backup userContent folder**

```java
~/.jenkins/userContent  目录
```

**Backup next build number file** ，下一个构建任务的序号，以pipeline-test01为例，当前最新构建任务序号为17，如下图

则next build number file为18，如下图

**Backup plugins archives** 备份插件目录

```java
 ~/.jenkins/plugins
```

其他参考文档，文档链接见最后

### 3.手动立即备份

点击Backup now就会立即备份

查看备份目录

### 4.从备份恢复

点击Restore

选择要恢复的备份，点击 恢复 按钮即可，注意，恢复完成后，需要重启 Jenkins 才生效恢复。

## 二、自定义脚本备份和恢复

实际就是将JENKINS_HOME进行定期备份，JENKINS_HOME目录路径查看和修改见下图

插件文档：https://plugins.jenkins.io/thinBackup/
