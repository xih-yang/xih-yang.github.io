# 10、Linux 基础 - 账号管理与ACL权限设置
- 来源：https://ddkk.com/zhuanlan/server/linux/4/10.html
- 分类：服务器框架
- 分组：教程目录
## Linux的账号与用户组

### 用户标识符：UID与GID

虽然我们登陆Linux主机的时候，输入的是我们的账号，但是其实Linux主机并不会直接认识【账号名称】，它仅认识ID（ID就是一组号码），你的ID与你的账号的对应就在/etc/passwd中。

每个登陆用户至少都会获得连个ID，一个是用户ID（User ID），一个是用户组ID（Group ID）

### 用户账号

登陆时，系统在做什么？

**1、** 先查找/etc/passwd里面是否有你输入的账号？如果没有则退出，如果有则将该账号对应的UID和GID读出来，另外，该账号的家目录与shell设置也一并读出；

**2、** 再来则是核对密码表这时Linux会进入/etc/shadow里面找出对应的账号与UID，然后核对一下你刚才输入的密码；

**3、** 如果没有问题，就进入shell管理阶段；

这两个文件很重要，一个是管理UID和GID参数的/etc/passwd，一个是管理密码的/etc/shadow，下面我们来介绍一下，更详细的内容请man 5 passwd，man 5 shadow

#### /etc/passwd 文件结构

这个文件的构造是这样的：每一行代表一个账号，有几行就代表有几个账号在你的系统里。不过需要特别注意的是，里面很多账号本来就是系统正常运行所必须的，我们可以简称他们是系统账号，这些账号请不要随意删除，像是bin、daemon、adm、nobody等。

/etc/passwd的内容大致如下：

每一个Linux系统都会有第1行，就是root这个系统管理员的一行。每一行用 : 做分隔，共有七个东西，分别是

- 账号名称

就是账号，提供给对数字不敏感的人类是用来登录的，需要用来对应UID

- 密码

早期的UNIX系统的密码就是放在这里，不过这个文件的特性就是所有的程序都能够读取，所以这样容易造成密码泄露，所以现在这里只有一个X，密码都放在/etc/shadow中了

- UID

用户标识符，通常LInux对于UID有几个限制需要了解一下：

id 范围

该 ID 使用者特性

0

(系统管理员)

当 UID 是 0 时，代表这个账号是『系统管理员』！ 所以当你要让其他的账号名称也具有 root 的权限时，将该账号的 UID 改为 0 即可。 不过，很不建议有多个账号的 UID 是 0 。

1~999

(系统账号)

保留给系统使用的 ID，其实除了 0 之外，其他的 UID 权限与特性并没有不一样。

默认 1000 以下的数字让给系统作为保留账号只是一个习惯。

由于系统上面启动的网络服务或后台服务希望使用较小的权限去运行，因此不希望使用root的身份去执行这些服务，所以我们就得要提供这些运行中程序的拥有者账号才行。这些系统账号通常是不可登录的，所以才会有我们以前说过的/sbin/nologin这个特殊shell的存在。

根据系统账号的由来，通常这类账号又大概被区分为两种：

- 1~200：由 distributions（发行版） 自行建立的系统账号；
- 201~999：若用户有系统账号需求时，可以使用的账号 UID。

1000~60000

(可登入账号)

给一般使用者用的。事实上，目前的 linux 核心 (3.10.x 版)已经可以支持到

4294967295 (2^32-1) 这么大的 UID 号码！

- GID

这个与/etc/group有关，其实/etc/group的概念与/etc/passwd差不多，只是他是用来规范组名与GID的对应而已。

- 用户信息说明栏：

这个字段基本上没有什么重要用途，只是用来解释这个账号的意义而已。不过，如果您提供使用finger的功能时，这个字段可以提供很多的信息。

- 家目录
- shell

默认用户登录会取得哪一个shell呢？就是由这个字段决定的。需要注意的是，有一个shell可以使账号在登录时无法获得shell环境，那就是/sbin/nologin 这个东西。这也可以用来制作纯pop邮件账号的数据。

#### /etc/shadow文件结构

很多程序的运行都与权限有关，而权限与UID和GID有关。因此各程序需要读取/etc/passwd来了解不同账号的权限，因此/etc/passwd的权限需要设置为-rw-r–r–这样的情况。密码现在都放在了/etc/shadow文件中，我们来了解一下他的结构：

基本上，shadow同样以【:】作为分隔符，有9个字段

- 账号名称
- 密码

这个字段内的数据才是真正的密码，而且是经过编码的密码（摘要），你只会看见一些特殊符号的字母。需要注意的是，这些加密过得密码虽然很难破解，但是还是可能会被破解的，所以这个文件的权限是【-rw——-】或是【———-】，即只有root才可以读写。

另外，由于各种密码编码的技术不一样，因此不同的编码系统会造成这个字段的长度不同。由于固定的摘要算法产生的密码长度是特定的，因此【当你修改这个字段后，改密码就会失效（算不出来）】。很多软件通过这个功能，在此字段前加上！或者 * 修改密码字段，就会让密码【暂时失效】

- 最近修改密码的日期

这个字段记录了【修改密码的那一天】。上面的数值并不是年月格式，这是因为计算Linux日期的时间是以1970年1月1日作为1而累加的日期，想要知道某个日期的累加日数，可以使用如下命令

```java
echo $(($(date --date="2020/03/08" +%s)/86400+1))
```

上述命令中，2020/03/08作为你想要计算的日期，86400为每一天的秒数，%s为1970/01/01以来的累积总秒数，由于bash仅支持整数，因此最终要加上1补齐1970/01/01当天。

- 密码不可被修改的天数（与第三字段相比）

这个字段记录了这个账号的密码在最近一次被更改后需要再经过几天才可以再被更改，单位为天，若为0则可以一直更改。

- 密码需要重新修改的天数（与第三字段相比）

为了强制用户修改密码，这个字段可以指定在最近一次更改密码后，在多少天数内需要再次修改密码才行。你必须在这个天数内重新设置你的密码，否则这个账号的密码就会【变为过期的特性】。

- 密码需要修改期限前的警告天数（与第五字段相比）

当账号的密码有效期限快要到的时候（第五字段），系统会根据这个字段的设置，发出警告信息给这个账号，告诉他【再过n天你的密码就要过期了，请尽快重新设置你的密码】

- 密码过期后的账号宽限时间（密码失效日）（与第五字段相比）

密码有效日期为【更新日期】+【重新修改日期】，过了该期限后用户依旧没有更新密码，那该密码就算过期了。虽然密码过期但是该账号还是可以用来执行其他的任务，包括登录系统获取bash。不过如果密码过期了，那当你登录系统时，系统会强制要求你必须重新设置密码才能登录继续使用，这就是密码的过期特性。

那这个字段的功能是什么呢？是在密码过期几天后，如果用户还是没有登录更改密码，那么这个账号的密码就会失效，即该账号再也无法使用该密码进行登录。**密码过期与密码失效并不相同。**

- 账号失效日期

这个日期跟第三个字段一样，都是使用1970年以来的总天数。这个字段表示：这个账号在此规定的字段之后，将无法再使用。这个字段通常被使用在【收费服务】的系统中，你可以规定一个日期让该账号不能再被使用。

- 保留

最后一个字段是保留的，看以后有没有新功能加入

> 举个例子来说好了，假如我的 dmtsai 这个用户的口令栏如下所示：
>
> dmtsai:$1$vyUuj.eX$omt6lKJvMcIZHx4H7RI1V.:14299:5:60:7:5:14419:
>
> 这表示什么呢？先要注意的是 14299 是 2009/02/24 。所以 dmtsai 这个用户的口令相关意义是：
>
>
> 由于口令几乎仅能单向运算(由明码计算成为口令，无法由口令反推回明码)，因此由上表的数据我们无法得知 dmstai 的实际口令明文；
> 此账号最近一次更动口令的日期是 2009/02/24 (14299)；
> 能够再次修改口令的时间是 5 天以后，也就是 2009/03/01 以前 dmtsai 不能修改自己的口令；如果用户还是尝试要更动自己的口令，系统就会出现这样的信息：
>
> You must wait longer to change your password
>
> passwd: Authentication token manipulation error
>
> 画面中告诉我们：你必须要等待更久的时间才能够变更口令之意啦！
>
>
> 由于口令过期日期定义为 60 天后，亦即累积日数为： 14299+60=14359，经过计算得到此日数代表日期为 2009/04/25。 这表示：『使用者必须要在 2009/03/01 到 2009/04/25 之间的 60 天限制内去修改自己的口令，若 2009/04/25 之后还是没有变更口令时，该口令就宣告为过期』了！
> 警告日期设为 7 天，亦即是口令过期日前的 7 天，在本例中则代表 2009/04/19 ~ 2009/04/25 这七天。 如果用户一直没有更改口令，那么在这 7 天中，只要 dmtsai 登陆系统就会发现如下的信息：
>
> Warning: your password will expire in 5 days
>
>
> 如果该账号一直到 2009/04/25 都没有更改口令，那么口令就过期了。但是由于有 5 天的宽限天数， 因此 dmtsai 在 2009/04/30 前都还可以使用旧口令登陆主机。 不过登陆时会出现强制更改口令的情况，画面有点像底下这样：
>
> You are required to change your password immediately (password aged)
>
> WARNING: Your password has expired.
>
> You must change your password now and login again!
>
> Changing password for user dmtsai.
>
> Changing password for dmtsai
>
> (current) UNIX password:
>
> 你必须要输入一次旧密码以及两次新密码后，才能够开始使用系统的各项资源。如果你是在 2009/04/30 以后尝试以 dmtsai 登陆的话，那么就会出现如下的错误信息且无法登陆，因为此时你的密码失效了！
>
> Your account has expired; please contact your system administrator
>
>
> 如果使用者在 2009/04/25 以前变更过口令，那么第 3 个字段的那个 14299 的天数就会跟着改变，因此， 所有的限制日期也会跟着相对变动。
> 无论使用者如何动作，到了 14419 (大约是 2009/07/24 左右) 该账号就失效了～

另外，如果密码忘记了，密码被修改了，那应该怎么做呢？

- 一般用户的密码忘记了：找系统管理员，他可以使用passwd命令来帮助你设置好新密码而不需要知道旧密码
- root密码忘记了：这就麻烦了。我们可以使用各种可行的方法启动进入Linux再去修改。例如重新启动进入单人维护模式（以后会学），系统会主动给与root权限到的bash接口，此时再以passwd修改密码即可。或以Live CD启动后挂载根目录去修改/etc/shadow，将里面的root的密码字段清空，再重新启动后root不用密码即可登录，登录后再赶快以 passwd命令去设置密码即可。

修改root密码：

**1、** 加载开机时，输入e，选第一个，输入e，选第二个，按e，空格，输入s，回车，选第二个，按b；

**2、** 在新的命令行，输入passwdroot，输入新密码，再重启（reboot）；

### 关于用户组：有效与初始用户组，groups，newgrp

上面介绍了用户，现在我们来了解一下用户组，这就需要了解/etc/group和/etc/gshadow

#### /etc/group 文件结构

这个文件就是在记录GID与组名的对应记录，

每一个字段的意义：

- 组名
- 用户组密码

通常不需要设置，这个设置通常是给【用户组管理员】使用目前很少有这个机会设置用户组管理员。同样，密码已经移动到了/etc/gshadow中，因此这个字段只会存在一个【X】而已

- GID

就是用户组ID。我们 /etc/passwd 第四个字段使用的GID对应的用户名，就是由这里对应来的。

- 此用户组支持的账号名称

一个账号可以加入多个用户组，如果某个账号想要加入此用户组时，将该账号填入这个字段即可。例如我们想要让luoluo和wenwen也加入root组中，可以这样：root:x:0:luoluo,wenwen，注意不要有空格

请注意，新版的Linux中第四个字段不会显示初始的这个用户，比如root这个账号的主要用户组是root组，但root用户组的四个字段中没有显示root用户。

加入我们一个账号加入了多个用户组，那么当我们作业的时候，应该以哪一个用户组为准？

这就涉及到有效用户组了

#### 有效用户组（effective group）与初始用户组（initial group）

groups

还记得每个用户在它的/etc/passwd 里面的第四栏有所谓的 GID 吧？那个 GID 就是所谓的【**初始用户组**（initial group）】。也就是说，当用户一登录系统，立刻就会拥有这个用户组的相关权限。

即我们/etc/passwd下的用户luoluo的GID是1000，所以在/etc/group中GID为1000的那行的第四个字段并没有显示luoluo，因为这是luoluo的初始用户组。

而如果一个用户想要加入非初始用户组，就需要在这个非初始用户组的第四个字段加入用户名。

而如果一个用户加入了很多用户组，他要建立一个新文件，那么这个文件的所属用户组是哪一个呢？

这就要看**有效用户组**了

当我们以luoluo这个用户登录后，我们可以使用命令 groups 来查看luoluo所加入的用户组

如图，luoluo加入了两个用户组——luoluo、wheel。

**第一个输出的用户组即为有效用户组（effective group）**

所以如果我现在去建立一个文件，那么这个文件的所属用户组就是luoluo

那么如何切换有效用户组呢？

#### newgrp

使用newgrp即可切换用户组（当然得失你已经有支持的用户组）

注意这个newgrp命令，这是以另外一个shell来提供（一个子进程），新的shell基给予luoluo有效GID为wheel，所以当你想要回到原本的环境中时，记得exit

虽然用户的环境设置（例如环境变量等其他数据）不会有影响，但是用户的【用户组权限】将会重新被计算。

#### /etc/gshadow

gshadow的内容大概如下

这些个字段几乎和/etc/group一模一样。要注意的就是第二个字段，这个就是密码栏，如果密码栏上面是！或 空，则表示该用户组不具有用户组管理员，第四个字段也就是所支持的账号名称。

四个字段分别是：

- 组名
- 密码栏
- 用户组管理员的账号
- 有加入该用户组支持的所属账号（与/etc/group内容相同）

以系统管理员的角度来说，这个gshadow最大的功能就是**建立用户组管理员**，那么什么是用户组管理员呢？由于系统上面的账号会很多，但是我们root可能平时太忙碌，所以当有用户想要加入某些用户组时，root或许会没有空管理。此时如果能够建立用户组管理员的话，那么**该用户组管理员就能够将那个账号加入自己管理的用户组中**，，可以免去root的忙碌。不过，由于现在有sudo等命令，这个用户组管理员概念已经很少使用了。

## 账号管理

### 新增与删除用户

#### useradd

使用命令 useradd 增加用户

```java
useradd [-u UID] [-g 初始用户组] [-G 次要用户组] [-mM]  \
> [-c 说明栏] [-d 家目录绝对路径] [-s shell] 使用者账号名
-u：后面接的是UID，是一串数字，直接指定一个特定的UID给这个账号
-g：初始用户组，该用户组的GID会放在/etc/passwd的第四个字段
-G：还可加入的用户组
-M：强制，不要建立使用者家目录（系统账号默认）
-m：强制，要建立使用者家目录（一般账号默认值）
-c：/etc/passwd的第五栏的说明内容
-d：指定某个目录称为家目录，而不要使用默认值，务必使用绝对路径
-r：建立一个系统的账号，这个账号的UID会有限制（参考/etc/login.defs）
-s：用户的shell，默认为/bin/bash
-e：后面接一个日期，格式 YYYY-MM-DD，即账号失效日
-f：后面接shadow的第七位选项，指定密码是否会失效，0位立即失效
    -l 为永远不失效（密码只会过期而强制于登录时重新设置而已）
```

我们来建立一个默认账号

##

系统已经帮助我们规定好很多的默认值了，所以我们可以使用 useradd 直接创建账号

- 在/etc/passwd 里面建立一行与账号相关的数据，包括建立UID/GID/家目录等
- 在/etc/shadow里面将此账号的密码相关参数写入，但是尚未有密码
- 在/etc/group里面加入一个与账号名称一模一样的组名
- 在/home下面建立一个与账号同名的目录作为用户家目录，且权限是 700

由于在/etc/shadow 内仅会有密码参数而不会有加密过的密码数据，因此我们建立用户账号时，还需要使用【passwd 账号】来设置密码才算是完成了用户建立的流程。如果由于特殊需求而需要修改用户相关参数时，就得要通过上述表格中的选项来进行建立了，参考下面的案例：

上例中指定了wheel为初始用户组，所以/etc/group中就不会建立与账号同名的用户组了。

接下来我们再建立一个系统账号

系统用户的UID一般就是1000以下了，另外，系统账号主要用来执行系统所需服务的权限设置，所以系统账号默认都不会主动建立家目录。

useradd默认建立的时候，为什么可以自动创建家目录，可以给密码失效日等做配置，它的参考是什么呢？

我们来了解一下 useradd 的参考文件

#### useradd参考文件

我们可以使用 useradd -D 来查看默认值

这个数据实际是由/etc/default/useradd 调用出来的，上面这些设置选项所实现的目的分别是：

- **GROUP=100：新建账号的初始用户组使用GID为100**

系统上面的GID为100者即users这个用户组，此设置选项指的就是让新建用户账号的初始用户组为users。但是我们知道CentOS中并不是这样，在CentOS中默认用户为与用户名称相同的用户组。为什么会这样？这是因为针对用户组的角度有两种不同的机制：

- **私有用户组机制**：系统会建立一个与账号一样的用户组给用户作为初始用户组。这种用户组设置会比较有保密性，这是因为用户都有自己的用户组，而且家目录的权限会是700。使用这种机制将不会参考GROUP=100这个设置值，代表的发行版有RHEL、Fedora、CentOS等

**公共用户组机制：**就是以 GROUP=100 这个设置值作为新建账号的初始用户组，因此每个账号都属于users组，且默认家目录通常的权限是【drwxr-xr-x】，因此大家都可以互相共享家目录内的数据，代表发行版如SUSE等。
HOME=/home：用户家目录的基准目录（basedir）

用户的家目录通常是与账号同名的目录。

- **INACTIVE=-1：密码过期够是否会失效的设置值**

我们在shadow文件结构中聊过，第七个字段的设置值将会影响到密码过期后，在多久时间内还可使用旧密码登录，这个选项就是在指定该天数。如果是 0 代表密码过期立即失效； -1 代表密码永远不会失效； 如30 代表过期30天才会失效。

- **EXPIRE=：账号失效的日期**

直接设置失效日期（/etc/passwd 的第八个字段）

- **SHELL=/bin/bash：默认使用的shell程序文件名**

系统默认的shell就写在这里。加入你的系统为邮件服务器，你希望每个账号都只能使用收发邮件的功能，而不允许用户登录系统获取shell，那么可以将这里设置为/sbin/nologin，如此一来，新建的用户默认就无法登录，也免去后续使用 usermod 进行修改的操作

- **SKEL=/etc/skel：用户家目录参考基准目录**

这个东西就是指定用户家目录的参考基准目录。以上面的例子为例，luoTest家目录/home/luoTest内的各项数据，都是由/etc/skel所复制过去的，所以，未来如果我想要新增用户时，该用户的环境变量~/.bashrc 设置妥当的话，可以到/etc/skel/.bashrc去编辑一下，也可以建立 /etc/skel/www 这个目录，那么未来新增用户后，在它的家目录下就会有www那个目录了。

- **CREATE_MAIL_SPOOL=yes：建立用户的mailbox**

你可以使用【 ll /var/spool/mail/luoTest 】看一下，会发现有这个文件的存在，这就是用户的邮箱。除了这些基本的账号设置之外，UID/GID的密码参数又是在哪里参考的呢？那就得看一下/etc/login.defs，这个文件的内容像是下面这样：

```java
MAIL_DIR /var/spool/mail <==使用者默认邮件信箱放置目录
PASS_MAX_DAYS 99999 <==/etc/shadow 内的第 5 栏，多久需变更密码日数
PASS_MIN_DAYS 0 <==/etc/shadow 内的第 4 栏，多久不可重新设置密码日数
PASS_MIN_LEN 5 <==密码最短的字符长度，已被 pam 模块取代，失去效用！
PASS_WARN_AGE 7 <==/etc/shadow 内的第 6 栏，过期前会警告的日数
UID_MIN 1000 <==使用者最小的 UID，意即小于 1000 的 UID 为系统保留
UID_MAX 60000 <==使用者能够用的最大 UID
SYS_UID_MIN 201 <==保留给使用者自行设置的系统帐号最小值 UID
SYS_UID_MAX 999 <==保留给使用者自行设置的系统帐号最大值 UID
GID_MIN 1000 <==使用者自订群组的最小 GID，小于 1000 为系统保留
GID_MAX 60000 <==使用者自订群组的最大 GID
SYS_GID_MIN 201 <==保留给使用者自行设置的系统帐号最小值 GID
SYS_GID_MAX 999 <==保留给使用者自行设置的系统帐号最大值 GID
CREATE_HOME yes <==在不加 -M 及 -m 时，是否主动创建使用者主文件夹？
UMASK 077 <==使用者主文件夹创建的 umask ，因此权限会是 700
USERGROUPS_ENAB yes <==使用 userdel 删除时，是否会删除初始群组
ENCRYPT_METHOD SHA512 <==密码加密的机制使用的是 sha512 这一个机制！
```

这个文件规范的数据则是如下所示：

- **mailbox 所在目录：** 使用者的默认 mailbox 文件放置的目录在 /var/spool/mail，所以vbird1 的 mailbox 就是在 /var/spool/mail/vbird1 啰！
- **shadow 密码第 4, 5, 6 字段内容：** 通过 PASSMAX_DAYS 等等设置值来指定的！所以你知道为何默认的 /etc/shadow 内每一行都会有“ 0:99999:7 ”的存在了吗？不过要注意的是，由于目前我们登陆时改用 PAM 模块来进行密码检验，所以那个 PASS_MIN_LEN是失效的！
- **UID/GID 指定数值：** 虽然 Linux 核心支持的帐号可高达 2的32次方 这么多个，不过一部主机要新建出这么多帐号在管理上也是很麻烦的！ 所以在这里就针对 UID/GID 的范围进行规范就是了。上表中的 UID_MIN 指的就是可登陆系统的一般帐号的最小 UID ，至于 UID_MAX则是最大 UID 之意。

要注意的是，系统给予一个帐号 UID 时，他是 （ 1） 先参考 UID_MIN 设置值取得最小数值； （ 2） 由 /etc/passwd 搜寻最大的 UID 数值， 将 （ 1） 与 （ 2） 相比，找出最大的那个再加一就是新帐号的 UID 了。

而如果我是想要创建系统用的帐号，所以使用 useradd -r sysaccount 这个 -r 的选项时，就会找“比 201 大但比 1000 小的最大的 UID ”就是了。

- **用户家目录设置值：** 为何我们系统默认会帮用户创建家目录？就是这个“CREATE_HOME = yes”的设置值啦！这个设置值会让你在使用 useradd 时， 主动加入“ -m ”这个产生家目录的选项。如果不想要创建家目录，就只能强制加上“-M ”的选项在 useradd 指令执行时。至于创建家目录的权限设置呢？就通过 umask这个设置值啊！因为是 077 的默认设置，因此使用者主文件夹默认权限才会是“ drwx—— ”。
- **用户删除与密码设置值：** 使用“USERGROUPS_ENAB yes”这个设置值的功能是： 如果使用 userdel 去删除一个帐号时，且该帐号所属的初始群组已经没有人隶属于该群组了， 那么就删除掉该群组。 “ENCRYPT_METHOD SHA512”则表示使用 SHA512 来加密密码明文，而不使用旧式的 MD5。

现在你知道啦，使用 useradd 这支程序在创建 Linux 上的帐号时，至少会参考：

/etc/default/useradd

/etc/login.defs

/etc/skel/*

这些文件，不过，最重要的其实是创建 /etc/passwd, /etc/shadow, /etc/group, /etc/gshadow还有用户家目录。所以，如果你了解整个系统运行的状态，也是可以手动直接修改这几个文件就是了。 OK！帐号创建了，接下来处理一下使用者的密码吧！

#### passwd

刚刚我们讲到了，使用 useradd 建立了账号之后，在默认的情况下，该账号是暂时被锁定的。也就是说，该账号是无法登录的。那么该怎么办？没事，给它设置新密码就好了，设置密码使用 passwd

```java
passwd [--stdin] [账号名称]        《==所有人可用，改密码
passwd [-l] [-u] [--stdin] [-S] [-n 日数]  \
>  [-x 日数] [-w 日数] [-i 日期] 账号      《==root可用
--stdin：可以通过来自前一个管道的数据，作为密码输入，对shell脚本有帮助
-l：是Lock的意思，将/etc/shadow第二栏前面加上!，使密码失效
-u：与 -l 相对，是Unlock的意思
-S：列出密码相关参数
-n：后面接天数，多久不可修改密码（shadow第4栏）
-x：后面接天数，多久内必须修改（shadow第5栏）
-w：后面接天数，密码过期前的警告天数（shadow第6栏）
-i：后面接日期，密码失效日期（shadow第7栏）
```

root修改密码

普通用户亲自修改密码

记住，用root给别人设置密码一定要注意 passwd 后面加账号名，否则就是修改root自己的密码了！

与root不同，一般用户修改密码的时候要求先输入自己的旧密码（即 current 那一行），然后再次输入密码。

密码的规范相当严格，尤其是新的Linux发行版大多使用 PAM 模块来进行密码的检验，直到看见 Successfully 这个关键字才是修改密码成功。

为什么用户设置自己的密码这么麻烦？因为密码的安全性。新的Linux发行版使用比较严格的PAM模块来管理密码，这个模块的机制卸载 /etc/pam.d/passwd 当中。而该文件与密码有关的测试模块就是使用 pam_cracklib.so，这个模块会检验密码相关的信息，并且替换 /etc/login.defs 内的 PASS_MIN_LEN 的设置。理论上，你的密码应该符合这些要求：

- 密码不能与账号相同
- 密码尽量不要选用字典里面会出现的字符串
- 密码需要超过 8 个字符
- 密码不要使用个人信息，如身份证、手机号码、其他电话号码等
- 密码不要使用简单的关系式，如 1+1=2等
- 密码尽量使用大小写字符、数字、特殊字符的组合

#### chage

除了使用 passwd -S之外，有没有更详细的密码参数显示功能呢？有的，那就是chage了

```java
chage [-ldEImMW] 账号名
-l：列出该账号的详细密码参数
-d：后面接日期，修改shadow第三栏
-E：后面接日期，修改shadow第八栏
-I：后面接天数，修改shadow第七栏
-m：后面接天数，修改shadow第四栏
-M：后面接天数，修改shadow第五栏
-w：后面接天数，修改shadow第六栏
```

利用这个命令我们可以强制某用户一登录必须修改密码

这样就是把密码建立时间改为1970/01/01，所以会有问题

#### usermod

如果我们在 useradd 的时候不小心加入了错误的设置数据，我们可以直接到/etc/passwd或/etc/shadow中去修改对应字段的数据，不过，我们还可以使用另一个命令来微调

```java
usermod [-cdegGlsuLU] username
-c：后面接账号的说明
-d：后面接账号的家目录
-e：后面接日期，/etc/shadow的第八栏
-f：后面接天数，为shadow的第七栏
-g：后面接初始用户组，/etc/passwd的第四栏
-G：后面接次要用户组，修改使用者能够支持的用户组
-a：与-G合用，可增加次要用户组的支持而非设置
-l：后面接账号名称，亦即修改账号名称，/etc/passwd 第一栏
-s：后面接shell的实际文件
-u：后面接UID的实际数据
-L：暂时冻结用户密码，使其无法登录
-U：将/etc/shadow密码栏的感叹号拿掉，解锁
```

有的功能可能有的发行版不支持，要注意。

#### userdel

这个功能就很简单了，删除用户的相关数据：

- 用户账号/密码相关参数：/etc/passwd、/etc/shadow
- 用户组相关参数：/etc/group、/etc/gshadow
- 用户个人文件数据：/home/username、/var/spool/mail/username

```java
userdel [-r] username
-r：连同用户的家目录一起删除
```

使用这个命令要注意了，一般而言，如果只是想禁用某个账号，可以在/etc/shadow中将账号失效日期设置成0，此时该账号的数据还会留下来；若你真的要删除这个用户，则可以使用此命令，另外注意，如果要将一个以前有人经常用的账号完整删除，最好先执行 find / -user username 来删了所有属于他的文件，再用 userdel

###

### 用户功能

useradd、userdel、usermod都是系统管理员的命令，那我们一般用户通常可以用哪些命令呢？如下：

#### id

id这个命令可以查询某人或自己的相关UID/GID的信息，它的参数也不少，不过，都不要记，使用id就全列出来了

#### finger

意思是指纹，这个命令可以查看很多用户相关的信息，大部分都是在/etc/passwd这个文件里面的信息，不过出于安全考虑，很多新版本默认不安装这个软件。

```java
finger [-s] username
-s：仅列出使用者的账号、全名、终端代号与登陆时间等
-m：列出后面接的账号相同者，而不是利用部分比对（包括全名部分）
```

果然是指纹，它会列出的很多信息：

- Login：用户账号
- Name：全名（passwd内的第五个字段——注释）
- Directory：就是家目录
- Shell：使用的Shell文件所在
- Never logged in：finger还会调查用户登录主机的情况
- No mail：调查/var/spool/mail内的邮箱数据
- No Plan：调查~username/.plan文件，并将改文件拿出来说明

你可以将你近期的计划写入.plan文件中，finger一下就可以看见了。另外，不加参数还可以列出当前系统上面登录的使用者与登录时间。

finger有这么多数据，该如何修改呢？

#### chfn

chfn就好像是 change finger 的缩写。

```java
chfn [-foph] [账号名]
-f：后面接完整的大名
-o：办公室房间号码
-p：办公室电话号码
-h：家里的电话号码
```

#### chsh

这个就是 change shell 的简写，使用方法很简单

```java
chsh [-ls]
-l：列出目前系统上面可用的 shell，其实就是 /etc/shells 的内容
-s：设置修改自己的 Shell
```

不论是chfn 与 chsh，都能够让一般用户修改/etc/passwd这个系统文件，那这个文件的权限一定有SUID功能了，看到这里，想到前面，这样学习最有效！

### 新增与删除用户组

了解了账号的新增、删除、修改与查询后，再来我们可以聊一聊用户组的相关内容了。基本上用户组的内容都与这两个文件有关：/etc/group、/etc/gshadow。用户组的内容其实很简单，都是上面两个文件的新增、修改、删除而已。

#### groupadd

```java
groupadd [-g gid] [-r] 用户组名称
-g：后面接某个特定的GID，用来直接设置GID
-r：建立系统用户组，与/etc/login.defs 内的 GID_MIN 有关
```

#### groupmod

进行group相关参数的修改

```java
groupmod [-g gid] [-n group_name] 用户组名
-g：修改既有的GID数字
-n：修改既有的用户组名称
```

不要随便修改 GID，容易造成系统资源混乱

#### groupdel

```java
groupdel [groupname]
```

删除用户组

注意，删除的用户组必须不是某个账号的初始用户组。

#### gpasswd

用户组管理员功能。

如何建立一个用户组管理员呢？就是让每一个用户组具有一个管理员，这个用户组管理员可以管理哪些账号可以加入/移出该用户组，通过 gpasswd 就可以建立一个用户组管理员

```java
#对于root的操作
gpasswd groupname
gpasswd [-A user1,...] [-M user3,...] groupname
gpasswd [-rR] groupname
   ：没有参数，表示设置groupname的密码
-A：将groupname的管理权交由后面的使用者管理（该用户组的管理员）
-M：将某些账号加入这个用户组当中
-r：将groupname的密码删除
-R：让groupname的密码栏失效
#对于用户组管理员（Group administrator）的操作
gpasswd [-ad] user groupname
-a：将某位使用者加入到groupname这个用户组当中
```

### 使用外部身份认证系统

在谈ACL 之前，我们先来谈一个概念性的操作，因为我们目前没有服务器可供练习。

有时候，除了本机的账号之外，我们可能还会使用到其他外部的身份验证服务器所提供的验证身份的功能。举例来说，Windows下面有个很有名的身份验证系统，称为活动目录（Active Directory，AD），还有Linux为了使不同主机使用同一组账号密码，也会使用到LDAP、NIS等服务器提供的身份验证等。

## 主机的详细权限规划：ACL的使用

### 什么是ACL与如何支持启动ACL

ACL是Access Control List的缩写，中文译为访问控制列表。主要目的是提供传统的属主、所属群组、其他人的读、写、执行权限之外的详细权限设置。对于需要特殊权限的使用状况非常有帮助：

ACL主要可以针对以下方面来控制权限：

- 用户（User）：可以针对用户来设置权限
- 用户组（Group）：针对用户组为对象来设置其权限
- 默认属性（mask）：还可以针对在该目录下建立新文件/目录时，规范新数据的默认权限

#### 如何启动ACL：

ACL是传统的 Unix-like 操作系统权限的额外支持选项，要使用 ACL 必须要有文件系统的支持才行。目前绝大部分的文件系统都有支持 ACL 的功能，包括 ReiserFS, EXT2、EXT3、EXT4, JFS, XFS 等等。我们可以使用命令来看是否支持启动ACL：

### ACL的设置技巧：getfacl、setfacl

如何设置ACL呢？

- getfacl：获取某个文件/目录的ACL设置权限
- setfacl：设置某个目录/文件的ACL规范

#### setfacl

setfacl 命令用法及最简单的【u:账号:权限】设置

```java
setfacl [-bkRd] [{-m|-x} acl 参数] 目标文件名
-m：设置后续的ACL参数给文件使用，不可与-x并用
-x：删除后续的ACL参数，不可与-m并用
-b：删除【所有的】ACL设置参数
-k：删除【默认的】ACL参数，关于所谓的【默认】参数与后续范例中介绍
-R：递归设置ACL，即包括子目录都会被设置起来
-d：设置【默认ACL参数】的意思，只对目录有效，在该目录新建的数据都引用此默认值
```

上面谈到ACL的选项功能，那么如何设置ACL的特殊权限呢？特殊权限的设置方法有很多，我们先来谈谈最常见的，就是针对单一用户的设置方法：

这是最简单的ACL设置，利用【u:用户:权限】的方式来设置，设置前请加上一个 -m 选项。一个文件设置了ACL后，后面的权限部分会多出一个+，此时你看到的权限和实际的权限的权限会有误差，所以我们应该通过 getfacl 来查看。

#### getfacl

```java
getfacl filename
可用选项几乎与 setfacl 相同
```

显示的数据前面有#号的，代表这个文件的默认属性，包括文件名、文件拥有者与文件所属用户组。下面出现的user、group、mask、other则是属于不同用户、用户组与有效权限（mask）的设置值。从上结果来看，我们的luoluo用户对该文件具有rx权限。

#### 针对特定用户组的权限设置【g:用户组名:权限】

#### 针对有效权限设置【m:权限】

你一定很好奇，上面的mask到底是个什么东西？其实他有点像是【有效权限】的意思。它的意义是：**用户或用户组所设置的权限必须要存于mask的权限设置范围内才会生效，此即有效权限（effective permission****）**

如上图所示，这样一来，luoluo用户和luoluo组都只有r权限可以生效。

#### 使用默认权限设置目录未来文件的ACL权限继承【d:[u|g]:[user|group]:权限】

下面我搬来鸟哥原书的内容

```java
# 4. 针对默认权限的配置方式：
# 配置规范：『 d:[ug]:使用者列表:[rwx] 』
# 让 myuser1 在 /srv/projecta 底下一直具有 rx 的默认权限！
[root@www ~]# setfacl -m d:u:myuser1:rx /srv/projecta
[root@www ~]# getfacl /srv/projecta
# file: srv/projecta
# owner: root
# group: projecta
user::rwx
user:myuser1:r-x
group::rwx
mask::rwx
other::---
default:user::rwx
default:user:myuser1:r-x
default:group::rwx
default:mask::rwx
default:other::---
[root@www ~]# cd /srv/projecta
[root@www projecta]# touch zzz1
[root@www projecta]# mkdir zzz2
[root@www projecta]# ll -d zzz*
-rw-rw----+ 1 root projecta    0 Feb 27 14:57 zzz1
drwxrws---+ 2 root projecta 4096 Feb 27 14:57 zzz2
# 看吧！确实有继承喔！然后我们使用 getfacl 再次确认看看！
[root@www projecta]# getfacl zzz2
# file: zzz2
# owner: root
# group: projecta
user::rwx
user:myuser1:r-x
group::rwx
mask::rwx
other::---
default:user::rwx
default:user:myuser1:r-x
default:group::rwx
default:mask::rwx
default:other::---
```

透过这个『针对目录来配置的默认 ACL 权限配置值』的项目，我们可以让这些属性继承到次目录底下呢！ 非常方便啊！那如果想要让 ACL 的属性全部消失又要如何处理？透过『 setfacl -b 文件名 』即可啦！ 太简单了！鸟哥就不另外介绍了！请自行测试测试吧！

在设置一个用户或用户组没有任何权限的ACL语法中，权限的字段不可留白，应该加一个减号-

## 用户身份切换

一般身份用户如何转换成root呢？主要有两种方式：

- su -：直接变身份成root。这个命令需要root的密码。
- sudo 命令：执行root的命令串，由于sudo需要事先设置妥当，且sudo需要输入用户自己的密码，因此多人共管一台主机时，sudo要比su来的好，至少root密码不会流出。

### su

```java
su [-lm] [-c 命令] [username]
-：单纯使用 - 如【su -】代表使用 login-shell 的变量文件读取方式来登录系统，
     若使用者名称没有加上去，则代表切换为root的身份
-l：与 - 类似，但后面需要加欲切换的使用者账号，也是 login-shell 的方式
-m：-m 与 -p 是一样的，表示【使用目前的环境设置，而不读取新使用者的配置文件】
-c：仅进行一次命令，所以 -c 后面可以加上命令
```

当我们直接使用su

所以这是一个不完全的变身。单纯使用【su】切换成为root的身份，读取的变量设置方式为非登录shell的方式，这种方式很多原本的变量不会被修改，尤其是我们之前谈到很多次的PATH这个变量。由于没有修改成为root的环境，因此很多root常用的命令就只能使用绝对路径来执行。其他的还有MAIL这个变量，你输入mail时，收到的邮件竟然还是luoluo的，而不是root本身的邮件，是否觉得很奇怪，所以切换身份的话，请务必使用如下方法：

这是使用login_shell来进行的登录，与上面的nonlogin大不相同，这是真正的登录。

那如果我只是想要执行一次【一个只有root才能执行的命令】，且执行完毕就恢复原来的身份，那我可以加上-c这个选项

另外，利用 su -l 用户名，还可以直接切换到其他某个用户（以 login-shell 方式）

*nologin更是适合于A登录A的情况（比如再开一个bash、图形界面打开终端），如果用于账号切换，权限就会给的不足*

### sudo

相对于su需要了解新切换的用户密码（常常是需要root的密码），sudo的执行则仅需要自己的密码即可。甚至可以设置不需要密码即可执行sudo，并非所有人都能执行sudo（否则人人都是root），仅有规范到/etc/sudoers 内的用户才能够执行 sudo 命令。

```java
sudo [-b] [-u 新使用者账号]
-b：将后续的命令放到后台中让系统自动执行，而不与目前的 shell 产生影响
-u：后面可以接欲切换的使用者，若无此选项代表切换 root
```

sudo可以让你切换身份来进行某项任务。

上面示例中我们就以sshd的用户身份去创建文件（注意：我们无法使用 su – sshd 去切换账号 ，因为系统账号的shell 是 /sbin/nologin），这个时候sudo真好用。

但是sudo默认仅有root能使用，为什么？因为sudo的执行是这样的：

**1、** 当用户执行sudo，系统于/etc/sudoers文件中查找该用户是否有执行sudo的权限；

**2、** 若用户具有可执行sudo的权限，便让用户输入自己的密码来确认；

**3、** 若密码输入成功，便开始进行sudo后连续的命令（但root执行sudo，不需要密码）；

**4、** 若欲切换的身份与执行者身份相同，那也不需要输入密码；

能否执行sudo必须要看 /etc/sudoers 的设置值，而可使用sudo者是通过输入用户自己的密码来执行后续的字符串。

由于能否使用与 /etc/sudoers 有关，所以我们要去编辑 sudoers，但是，因为该文件的内容有一定的规范，所以直接使用 vi 去编辑是不好的，此时，我们就得要通过 visudo 去修改

#### visudo与/etc/sudoers

为什么要使用 visudo呢？因为/etc/sudoers是设置过语法的，如果设置错误就会造成无法使用sudo的后果，因此我们应该使用visudo来修改，并且在结束退出修改界面时，操作系统会去检验 /etc/sudoers 的语法是否正确。

visudo的设置有几种简单的方法：

- **单一用户可使用root的所有命令，与sudoers文件语法**

假如我们要让luoluo拥有root的任何命令，则如下操作

使用命令 visudo ，在大约第99行左右的位置，在root下面加上luoluo

这一行四个字段的意义是：

**1、** 【用户账号】：操作系统的哪个账号可以使用sudo这个命令；

**2、** 【登录者的来源主机名】：当这个账号由哪台主机连接到本Linux主机；

**3、** 【(可切换的身份)】：这个账号可以切换成什么身份来执行后续的命令，默认root可以切换成任何人；

**4、** 【可执行的命令】：可用该身份执行什么命令？这个命令请务必使用绝对路径；

ALL是一个关键字，代表任何身份、主机或命令的意思。

合起来，就是说：luoluo不管来自哪一台主机，它可以切换身份成为任何人，且可以进行系统上面的任何命令（利用sudo）。

- **利用用户组以及免密码的功能处理 visudo**

如果我们想要指定一个用户组的人来，比如wheel组

使用命令 visudo，找到第106行左右的wheel组，修改

这样，但凡是wheel组的，就可以使用sudo切换成任意身份了

> 顺便提一句，如果你想要让用户连自己的密码都不用输入，那就可以使用关键字——NOPASSWD，就像上面示例的下行那样

- **有限制的命令操作**

上面两点都可以让用户能够利用root的身份进行任何事情，如果我想要让用户仅能够进行部分系统任务。比方说，系统上面的luoluo仅能够帮root修改其他用户的密码时，即【当用户仅能使用 passwd 这个命令帮助root修改其他用户的密码】时，该怎么写？

可以这样：

注意，最后一个使用的命令一定，一定，一定得是绝对路径

但是实验一下我们会知道，如果我们直接使用 sudo passwd，后面不加用户名，则会直接修改root的密码，这是很不合理的，所以我们应该这么设置

前面加上 ! 就是不可执行的意思。这样一来，该用户就不可以使用 sudo passwd、sudo passwd root 这种命令了，但是可以帮别的用户修改密码。

- **通过别名创建 visudo**

如果我们不止luoluo，我们有很多用户要得到这种改密码的权限，那我们应该怎么做呢？写好多行吗？其实Linux有一个别名功能，看了例子你就懂了：

我们通过User_Alias创建一个新账号，这个账号名称一定要使用大写字符来处理，包括 Cmnd_Alias（命令别名）、Host_Alias（来源主机别名），都需要使用大写字符。这样设置别名也方便我们以后修改。

- **sudo 的时间间隔问题**

如果我使用同一个账号在短时间内重复操作sudo来运行命令，在第二次执行sudo的时候，并不需要输入自己的密码，sudo还是会正确的运行。

两次sudo的间隔在5分钟内，就第二次可以不必输入密码（因为系统相信你5分钟内不会离开座位）。

- **sudo搭配su的使用方式**

有没有什么办法让我们可以一口气转为 root，而且还用自己的密码来变成 root 呢？如下

这样，只要指定用户在命令行中输入 sudo su -，就可以输入自己的密码来变身 root 了

## 用户的特殊shell与PAM模块

如果我想要建立一个【仅能使用邮件服务器相关服务的账号，而该账号并不能登录Linux主机】呢？

### 特殊的shell，/sbin/nologin

本章一开头，我们谈过系统账号，它的shell就是使用/sbin/nologin，重点在于系统账号是不需要登录的。所以我们就给它这个无法登录的合法shell。我们所谓的无法登录是指：这个用户无法使用bash或其他shell来登录系统，而已，并不是说这个账号就无法使用其他的系统资源。

距离来说，各个系统账号，打印作业由IP这个账号在管理，WWW服务由apache这个账号在管理，他们都可以进行系统程序的工作，但是就是无法登录主机获取交互的shlel而已。

换个角度来想，如果我的Linux主机提供的是邮件服务，那么在这台Linux主机上面的账号，其实大部分都是用来收受主机的邮件而已，并不需要登录主机。这个时候，我们就可以考虑让单纯使用mail的账号以/sbin/nologin做为他们的shell。这样，最起码当我的主机被尝试想要登录系统以获取shell环境时，可以拒绝该账号。

另外，若我想要让某个具有/sbin/nologin的用户知道，他们不能登录主机时，其实我可以建立/etc/nologin.txt这个文件，并且在这个文件内说明不能登录的原因，那么下次当这个用户想要登录系统时，屏幕上就会出现 /etc/nologin.txt的内容，而不是默认内容。

### PAM模块

在过去，我们想要对一个用户进行认证，得要求用户输入账号密码，然后通过自行编写的程序来判断该账号密码是否正确。也因为如此，我们常常得使用不同的机制来判断账号密码，所以搞的一台主机上面拥有多个不同的认证系统，也造成账号密码可能不同步的验证问题。为了解决这个问题，才有了PAM（Pluggable Authentication Modules，插入式验证模块）的机制。

PAM可以说是一套应用程序编程接口（Application Programming Interface，API），它提供了一连串的验证机制，只要用户将验证阶段的需求告知PAM后，PAM就能够返回用户验证的结果（成功或失败）。由于PAM仅是一套验证的机制，又可以提供给其他程序所调用引用，因此不论你使用什么程序，都可以使用PAM来进行验证，如此一来，就能够让账号密码或是其他方式的验证具有一致性的效果，也让程序员方便处理验证问题。

PAM以一个独立的API存在，任何程序有需求时，可以向PAM发出验证要求的通知，PAM经过一连串的验证后，将验证的结果返回给该程序，然后该程序就能够利用验证的结果来允许登录或显示其他无法使用的信息。这也就是说，你可以在写程序的时候加入PAM模块的功能，从而利用PAM的验证功能。目前很多程序都会利用PAM，所以我们才要学习它。

PAM用来进行验证的数据称为模块（Modules），每个PAM模块的功能都不太相同。举例来说，还记得passwd命令吗，如果随便输入简单的字符串，passwd就会返回错误信息，这是为什么呢？这就是PAM的pam_cracklib.so模块的功能。它能够判断该密码是否在字典里面，并返回给密码修改程序，此时就能够给了解你的密码强度了。

所以，当你有任何需要判断是否在字典当中的密码字符串时，就可以使用pam_cracklib.so模块来验证，并根据验证的返回结果来编写你的程序。

### PAM模块设置语法

PAM借由一个与程序相同文件名的配置文件来完成一连串的认证分析需求，我们同样以passwd这个命令调用PAM来说明。当你执行passwd后，这个程序调用PAM的流程是：

**1、** 用户开始执行/usr/bin/passwd这个程序，并输入密码；

**2、** passwd调用PAM模块进行验证；

**3、** PAM模块会到/etc/pam.d/找寻与程序（passwd）同名的配置文件；

**4、** 根据/etc/pam.d/passwd内的设置，引用相关的PAM模块逐步进行验证分析；

**5、** 将验证结果（成功、失败以及其他信息）返回给passwd程序；

**6、** passwd程序根据PAM的返回结果决定下一个操作；

重点是在/etc/pam.d/里面的配置文件，我们来看看这个/etc/pam.d/passwd的内容

接下里我们来分析字段

- 第一个字段：验证类别（type）
- **auth**：是authentication（认证）的缩写，主要用来检验用户的身份，这种类别通常是需要密码来检验的，所以后续接的模块用来检验用户的身份
- **account**：account（账号）大部分用于进行 authorization（授权），这种类别主要检验了用户是否具有正确的权限。距离来说，当你使用一个过期密码来登录，就无法登录了
- **session**：session是会话期间的意思，所以session管理的就是用户在这次登录（或使用这个命令）期间，PAM所给予的环境设置。这个类别通常用于记录用户登录与注销时的信息。例如，如果你常常使用su或sudo命令的话，那么应该可以在/var/log/secure 日志里面发现很多关于PAM的说明，而且记载的数据是【session open，session close】的信息
- **password**：password 就是密码，所以这种类型主要在提供验证的修订任务，举例来说就是修改密码。
- 第二个字段：验证的控制标识（control flag）
- **required**：若验证成功则带有 success（成功）的标志，若失败则带有failure的标志，但不论成功或失败都会继续后续的验证流程。由于后续的验证流程可以继续进行，因此相当有利于数据的记录（log），这也是PAM最常使用的required的原因。
- **requisite**：若验证失败则立刻返回原程序failure的标志，并终止后续的验证流程。若验证成功则带有success的标志并继续后续的验证流程。这个选项与required最大的差异，就在于失败的时候还要不要继续验证下去？由于requisite是失败就终止，因此失败时产生的PAM信息就无法通过后续模块来记录。
- **sufficient**：若验证成功则立刻返回success给原程序，并终止后续的验证流程。若验证失败则带有failure标志并继续后续的验证流程。这个标识与requisite正好相反
- **optional**：这个模块控件大多是在显示信息而已，并不用在验证方面

### 常用模块介绍

谈完了配置文件的语法之后，我们来看看CentOS提供的PAM默认文件的内容是什么。由于我们常常需要通过各种方式登录（login）系统，因此就来看看那登录所需要的PAM流程是什么

我们可以看到login多次调用了system-auth，所以下面列出该配置文件

上面表格中使用到非常多的PAM模块，每个模块的功能都不太相同，详细的模块信息可以在你的系统中找到

- /etc/pam.d/*：每个程序的PAM配置文件
- /lib64/security/*：PAM模块文件的实际放置目录
- /etc/security/*：其他PAM环境的配置文件
- /usr/share/doc/pam-*/：详细的PAM说明文件

> 常见模块：
>
> · pam_securetty.so：
>
> 限制系统管理员 (root) 只能够从安全的 (secure) 终端机登入；那什么是终端机？例如 tty1, tty2 等就是传统的终端机装置名称。安全的终端机设定写在 /etc/securetty 这个文件中。你可以查阅一下该文件， 就知道为什么 root 可以从 tty1~tty7 登入，但却无法透过 telnet 登入 Linux 主机了！
>
> · pam_nologin.so：
>
> 这个模块可以限制一般用户是否能够登入主机之用。当 /etc/nologin 这个文件存在时，则所有一般使用者均无法再登入系统了！若 /etc/nologin 存在，则一般使用者在登入时， 在他们的终端机上会将该文件的内容显示出来！所以，正常的情况下，这个文件应该是不能存在系统中的。 但这个模块对 root 以及已经登入系统中的一般账号并没有影响。 (注意这与 /etc/nologin.txt 并不相同)
>
> · pam_selinux.so：
>
> SELinux 是个针对程序来进行细部管理权限的功能，SELinux 这玩意儿我们会在第十六章的时候再来详细谈论。由于 SELinux 会影响到用户执行程序的权限，因此我们利用 PAM 模块，将 SELinux 暂时关闭，等到验证通过后， 再予以启动！
>
> · pam_console.so：
>
> 当系统出现某些问题，或者是某些时刻你需要使用特殊的终端接口 (例如 RS232 之类的终端联机设备) 登入主机时， 这个模块可以帮助处理一些文件权限的问题，让使用者可以透过特殊终端接口 (console) 顺利的登入系统。
>
> · pam_loginuid.so：
>
> 我们知道系统账号与一般账号的 UID 是不同的！一般账号 UID 均大于 1000 才合理。 因此，为了验证
>
> 使用者的 UID 真的是我们所需要的数值，可以使用这个模块来进行规范！
>
> · pam_env.so：
>
> 用来设定环境变量的一个模块，如果你有需要额外的环境变量设定，可以参考 /etc/security/pam_env.conf 这个文件的详细说明。
>
> · pam_unix.so：
>
> 这是个很复杂且重要的模块，这个模块可以用在验证阶段的认证功能，可以用在授权阶段的账号许可证管理， 可以用在会议阶段的登录文件记录等，甚至也可以用在密码更新阶段的检验！非常丰富的功能！ 这个模块在早期使用得相当频繁喔！
>
> · pam_pwquality.so：
>
> 可以用来检验密码的强度！包括密码是否在字典中，密码输入几次都失败就断掉此次联机等功能，都是这模块提供的！ 最早之前其实使用的是 pam_cracklib.so 这个模块，后来改成 pam_pwquality.so 这个模块，但此模块完全兼容于 pam_cracklib.so， 同时提供了 /etc/security/pwquality.conf 这个文件可以额外指定默认值！比较容易处理修改！
>
> · pam_limits.so：
>
> 还记得我们在第十章谈到的 ulimit 吗？ 其实那就是这个模块提供的能力！还有更多细部的设定可以考：/etc/security/limits.conf 内的说明。

我们来讨论一下login的验证机制流程

login 的 PAM 验证机制流程：

**1、** 验证阶段(auth)：首先，(a)会先经过pam_securetty.so判断，如果使用者是root时，则会参考/etc/securetty的设定；接下来(b)经过pam_env.so设定额外的环境变量；再(c)透过pam_unix.so检验密码，若通过则回报login程序；若不通过则(d)继续往下以pam_succeed_if.so判断UID是否大于1000，若小于1000则回报失败，否则再往下(e)以pam_deny.so拒绝联机；

**2、** 授权阶段(account)：(a)先以pam_nologin.so判断/etc/nologin是否存在，若存在则不许一般使用者登入；(b)接下来以pam_unix.so及pam_localuser.so进行账号管理，再以(c)pam_succeed_if.so判断UID是否小于1000，若小于1000则不记录登录信息(d)最后以pam_permit.so允许该账号登入；

**3、** 密码阶段(password)：(a)先以pam_pwquality.so设定密码仅能尝试错误3次；(b)接下来以pam_unix.so透过sha512,shadow等功能进行密码检验，若通过则回报login程序，若不通过则(c)以pam_deny.so拒绝登入；

**4、** 会议阶段(session)：(a)先以pam_selinux.so暂时关闭SELinux；(b)使用pam_limits.so设定好用户能够操作的系统资源；(c)登入成功后开始记录相关信息在登录文件中；(d)以pam_loginuid.so规范不同的UID权限；(e)开启pam_selinux.so的功能；

> 例题：
>
> 为什么 root 无法以 telnet 直接登入系统，但是却能够使用 ssh 直接登入？
>
> 答：一般来说， telnet 会引用 login 的 PAM 模块，而 login 的验证阶段会有 /etc/securetty 的限制（规定只能从“安全终端机”登录root）！ 由于远程联机属于 pts/n (n 为数字) 的动态终端机接口装置名称，并没有写入到 /etc/securetty ， 因此 root 无法以 telnet 登入远程主机。至于 ssh 使用的是 /etc/pam.d/sshd 这个模块， 你可以查阅一下该模块，由于该模块的验证阶段并没有加入 pam_securetty ，因此就没有/etc/securetty 的限制！故可以从远程直接联机到服务器端。

### 其他相关文件

除了前一小节谈到的/etc/securetty会影响到root可登录的安全终端，/etc/nologin 会影响到一般用户是否能够登录的功能之外，我们也知道PAM相关的配置文件在 /etc/pam.d，，说明文件主要在/etc/security这个目录内。我们下面来介绍几个可用到的配置文件

- limits.conf

我们以前谈到过 ulimit 功能，除了修改用户的 ~/.bashrc 配置文件之外，其实系统管理员可以统一通过PAM来管理，那就是 /etc/security/limits.conf这个文件的设置了。这个文件的设置简单，你可以自行参考一下该文件内容，我们这里仅作个简单的介绍：

vim/etc/security/limits.conf，加入这么两行命令

然后退出系统，重新以luoluo登录，然后就会发现限制

我们在/etc/security/limits.conf中加入的四个字段的意义是：

- 账号，或是用户组，注意用户组需要前面@
- 限制数据，严格（hard）还是警告（soft）
- 相关限制，此例为限制文件容量
- 第四栏为限制的值，此例单位为kb

设置完成就可以生效，你不用重新启动任何服务，但是PAM有个特殊的地方，由于它是在程序调用时才予以设置的，因此你修改完成的数据，对于已经登录系统中的用户是没有效果的，要等他重新登录才会生效。

## Linux主机上的用户信息传递

### 查询用户：w、who、last、lastlog

使用w或who可以查询现在在系统登录的用户

使用lastlog（它会读取/var/log/lastlog文件）显示每个账号最近登录时间

### 用户对谈：write、mesg、wall

```java
write 账号 （所在终端界面）
```

就可以发送信息了

如果一个用户不想接受别人的信息，那么他可以使用

```java
mesg n
```

然后使用 mesg 查看，就会输出 is n

不过，这个mesg的功能对root传送来的信息没有阻止root发送给其信息的能力

如果想要开启，就输入 mesg y 就好了。

另外我们还可以向所有在线用户广播消息，使用 wall 即可，后面加上广播的语句。

### 用户邮箱：mail

#### 发送邮件

以上wall、write毕竟是等到用户在线才能够进行，有没有其他方式来联络？不是说每个Linux主机上面的用户都具有一个 mailbox 吗？我们可否发邮件给用户？可以的，我们可以收或寄mailbox内的邮件。一般来说，mailbox都会放置在/var/spool/mail里面，一个账号一个mailbox（文件）。举例来说，我的luoluo就具有/var/spool/mail/luoluo这个mailbox。

那么我该如何寄出邮件？直接使用mail这个命令即可。这个命令的用法很简单，直接执行【mail -s “邮件标题” username@localhost】即可。一般来说，如果是寄给本机的用户，基本上连【@localhost都不用写】。

输入邮箱，只要在最后一行输入 . 即可表示结束。

另外如果觉得输入很麻烦，可以利用数据流重定向将一个文件内容流入邮件信息中，比如：mail -s “title” luoluo 号右边有一个N，则代表这是一个未读邮件，如果想要看具体内容，则在下面的&后面输入?

几个比较常见的命令：

命令
意义

h
列出信件标头；如果要查阅 40 封信件左右的信件标头，可以输入『 h 40 』

d
删除后续接的信件号码，删除单封是『 d10 』，删除 20~40 封则为『 d20-40 』。 不过，这个动作要生效的话，必须要配合 q 这个命令才行(参考底下说明)！

s
将信件储存成文件。例如我要将第 5 封信件的内容存成 ~/mail.file:『s 5 ~/mail.file』

x
或者输入 exit 都可以。这个是『不作任何动作离开 mail 程序』的意思。 不论你刚刚删除了什么信件，或者读过什么，使用 exit 都会直接离开 mail，所以刚刚进行的删除与阅读工作都会无效。 如果您只是查阅一下邮件而已的话，一般来说，建议使用这个离开啦！除非你真的要删除某些信件。

q
相对于 exit 是不动作离开， q 则会进行两项动作： 1. 将刚刚删除的信件移出 mailbox 之外； 2. 将刚刚有阅读过的信件存入 ~/mbox ，且移出 mailbox 之外。鸟哥通常不很喜欢使用 q 离开， 因为，很容易忘记读过什么咚咚～导致信件给他移出 mailbox 说～

## CentOS7环境下大量创建账号的方法

### 一些账号相关的检查工具

#### pwck

pwck这个命令会检查 /etc/passwd 这个账号配置文件内的信息，检查实际的家目录是否存在等信息，还可以比对 /etc/passwd 与 /etc/shadow 的信息是否一致。若/etc/passwd 中的数据字段有误时，会提示用户修正。一般来说，我只是利用这个命令检查我的输入是否正确。

看，它提示这些用户没有家目录，不过这些多是系统用户，也不需要有家目录，这是正常的错误。

同样的，用户组检查可以使用 grpck

#### pwconv

这个命令主要的目的是在【将/etc/passwd内的账号与密码，移动到/etc/shadow当中】。

早期的UNIX系统当中并没有/etc/shadow，所以，用户的登录密码早期是在/etc/passwd的第二栏。后来为了系统安全，才转移到/etc/shadow内，使用 pwconv 后，可以：

- 对比/etc/passwd及 /etc/shadow，若/etc/passwd内的账号并没有对应的/etc/shadow密码时，则 pwconv 会去/etc/login.defs读取相关的密码数据，并建立该账号的/etc/shadow数据
- 若/etc/passwd中存在加密后的密码数据时，则pwconv会将该密码栏移动到/etc/shadow中，并将原本的/etc/passwd中相对应的密码栏改成x。

一般来说，如果你正常使用useradd增加用户时，使用pwconv不会有任何操作，因为/etc/passwd与/etc/shadow并不会有上述两点问题。

#### pwunconv

相对于pwconv，pwunconv则是【将/etc/shadow内的密码栏数据写回/etc/passwd当中，并删除/etc/shadow文件】。这个命令最好不要使用。

#### chpasswd

他可以【读入未加密前的密码，并且经过加密后，将加密后的密码写入/etc/shadow当中】，这个命令在大量创建账号时经常被使用。他可以由标准输入读入数据，每条数据的格式是【user:passwd】。

### 大量创建账号的模板

下面有一个简单的新增用户的脚本来实现新增用户功能

```java
[root@study ~]# vim accountadd.sh
#!/bin/bash
# This shell script will create amount of linux login accounts for you.
# 1\. check the "accountadd.txt" file exist? you must create that file manually.
#    one account name one line in the "accountadd.txt" file.
# 2\. use openssl to create users password.
# 3\. User must change his password in his first login.
# 4\. more options check the following url:
# 0410accountmanager.html#manual_amount
# 2015/07/22    VBird
export PATH=/bin:/sbin:/usr/bin:/usr/sbin
# 0\. userinput
usergroup=""                   if your account need secondary group, add here.
pwmech="openssl"               "openssl" or "account" is needed.
homeperm="no"                  if "yes" then I will modify home dir permission to 711
# 1\. check the accountadd.txt file
action="${1}"                  "create" is useradd and "delete" is userdel.
if [ ! -f accountadd.txt ]; then
    echo "There is no accountadd.txt file, stop here."
        exit 1
fi
[ "${usergroup}" != "" ] && groupadd -r ${usergroup}
rm -f outputpw.txt
usernames=$（cat accountadd.txt）
for username in ${usernames}
do
    case ${action} in
        "create"）
            [ "${usergroup}" != "" ] && usegrp=" -G ${usergroup} " || usegrp=""
            useradd ${usegrp} ${username}               新增帐号
            [ "${pwmech}" == "openssl" ] && usepw=$（openssl rand -base64 6） || usepw=${username}
            echo ${usepw} | passwd --stdin ${username}  创建密码
            chage -d 0 ${username}                      强制登陆修改密码
            [ "${homeperm}" == "yes" ] && chmod 711 /home/${username}
        echo "username=${username}, password=${usepw}" >> outputpw.txt
            ;;
        "delete"）
            echo "deleting ${username}"
            userdel -r ${username}
            ;;
        *）
            echo "Usage: $0 [create|delete]"
            ;;
    esac
done
```

接下来只要创建 accountadd.txt 这个文件即可！鸟哥创建这个文件里面共有 5 行，你可以自行创建该文件！内容每一行一个帐号。 而是否需要修改密码？是否与帐号相同的信息等等，你可以自由选择！若使用 openssl 自动猜密码时，使用者的密码请由 outputpw.txt 去捞～鸟哥最常作的方法，就是将该文件打印出来，用裁纸机一个帐号一条，交给同学即可！

```java
[root@study ~]# vim accountadd.txt
std01
std02
std03
std04
std05
[root@study ~]# sh accountadd.sh create
Changing password for user std01.
passwd: all authentication tokens updated successfully.
....（后面省略）....
```
