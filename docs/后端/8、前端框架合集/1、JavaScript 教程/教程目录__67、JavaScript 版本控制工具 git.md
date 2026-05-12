# 67、JavaScript 版本控制工具 git
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/67.html
- 分类：前端框架
- 分组：教程目录
### 安装git

**1、** 安装git客户端（去网上搜索下载就好了，很简单）window系统；

安装之后，在菜单的应用程序下就会有一个git文件夹。git文件夹下面有三个主要的控制台

gitBash:支持linux命名的git控制台 （最常用）

gitCMD：支持window命令的控制台

gitGUI: git可视化界面

苹果自带git

**2、** VSCode安装git插件；

快捷键ctrl+~ 迅速打开终端，并且当前路径是我当前页面所在路径

下载安装完毕git之后，就可以github官网地址（https://github.com/） 注册账号啦。

### git命令操作

**1、** 前序准备工作：创建一个文件夹，打开gitBash控制台，输入cd新建文件夹的路径；

**2、** 配置一些基本操作（提交到github远程仓库的地址和名字）；

gitconfig --global user.name “github注册的用户名”

gitconfig --global user.email ‘github注册时使用的邮箱’

注：输完之后没有任何反应，就证明你输入的没有问题。

git操作

将本地代码提交到github远程仓库的流程示意图：

暂存区也叫做本地仓库：

#### 一.创建远程仓库：

登录github之后，点击右上角+号，点击New repository

注意：创建过程不要太久，要不就很容易掉线。。。。。

#### 二.在本地创建暂存区(虚拟仓库)

接着回到我们的git Bash中，对我们刚刚创建的的项目，进行初始化

命令:git init

.git虚拟文件： 存储我们当前项目的所有版本信息

#### 三.从工作区提交到暂存区

前序工作：在项目创建文件，等待提交到暂存区（记得添加一个说明书文件.md后缀，用于对该项目描述）

**1、** 提交；

提交单个文件：git add 文件名

提交所有文件：git add *

**2、** 本次提交的描述：gitcommit-m‘这一次提交的描述’；

**3、****查看工作区状态**（代码是否提交成功）；

gitstatus

'nothing to commit, workingg tree clean‘：没有什么要提交的，工作区干净

证明当前工作区没有什么可以提交了，所有文件已经全部提交到暂存区了。

当我们修改文件的内容时

再去输入 git status 命令

就会显示工作区有待提交的文件。

此时有两种解决办法：1.重新提交，覆盖原有的暂存区的 2.撤销工作区的对这个两个文件的操作，与暂存区的文件保持一致。

**4、****撤销**：撤销工作区的对这个两个文件的操作，与暂存区的文件保持一致；

命令:git restore 文件名

gitrestore 作用：就是将暂存区恢复到工作区

**5、****查看工作区与暂存区的区别**；

命令:git diff

重新提交之后，再去输入git diff 就不会出现任何变化了

**6、****clear清屏**；

**7、****撤销删除**；

假如我在当前项目底下新建了许多文件文件，并全部一起提交到了暂存区。但是后面如果不小心将那些新建的文件全部删除了。

查看已经提交的历史版本：git log

恢复文件到指定的某一版本：git reset --hard 指定的版本号

版本号：就是commit 后面那一串数字

此时删除的文件也就全部回来了。

gitreset --hard HEAD^ 退回到上一版本

注：倒数第二个版本，不是最新提交的版本，git reset --hard HEAD退回到最新提交的版本。

^表示退回的版本数：例如git reset --hard HEAD^^ 退回到两个版本，倒数第三个

#### 四：从暂存区提交到远程仓库

##### 首次提交：

**1、** 生成SSH密匙：远程仓库对本地电脑授权如果不进行授权，就会提交失败；

命令：ssh-keygen -t rsa -C ‘注册github的邮箱地址’ 回车 回车

如果已经注册过，可以选择覆盖，没有注册过就一直回车就行。

window电脑查找隐藏文件：我的电脑=>用户=>管理员用户名文件夹=>.ssh(隐藏文件)=>xxx.pub（存有密匙）。也可以将上图的路径复制到文件地址栏查看就好了。

将那一串密匙复制下来，去github账户那配置密匙。

点击头像->settings->ssh and GPG keys ->New ssh key->将复制的密匙全部拷贝到key下。

提交之后，就会显示l

**3、** 上传到远程仓库；

命令1：git remote add origin 远程仓库地址（https://github.com/你的账号/你的项目名称）可以在github查看，记得是https的仓库地址，不是ssh

命令2：git push -u origin master 将本地的库推送到master分支 （就是推送到服务器上）

**不是首次提交：以上步骤可以跳过：直接输入 git push 即可**

注：提交过程，可能需要你输入用户名，密码。

#### 五：克隆

假如别人需要你的仓库代码时，你就可以将你的仓库地址给他。然后它自己再新建一个文件夹，专门去存储你的代码的，然后进入到新的文件夹中输入

gitclone ‘共享仓库的仓库地址’

假如我的代码更新了，但是另一个共享我的代码的人还是使用上一个版本的话，那么就会在共享的代码的人想要提交到我的仓库时，代码就会发生冲突。因此，共享的我代码的人，必须要更新的代码：命令：git pull （从远程仓库更新的本地代码，同步仓库代码）

#### git提交代码常见错误：

**1、** 假如出现一不小心输错远端仓库地址了：；

输入命令git remote rm origin（删除关联的origin的远程仓库）

**2、** 假如出现以下错误网络问题；

```java
fatal: unable to access 'https://github.com/lijia-bb/git-learn.git/': OpenSSL SSL_read: Connection was reset, errno 10054
```

输入：断掉所有网络代理

```java
git config --global --unset http.proxy
git config --global --unset https.proxy
```

**3、** 从工作区提交到暂存区之后，因为删除了某个文件夹，导致第二次提交失败：；

解决：重新提交当前目录下的文件 git add .
