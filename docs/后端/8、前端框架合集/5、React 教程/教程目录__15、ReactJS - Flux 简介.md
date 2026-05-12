# 15、ReactJS - Flux 简介
- 来源：https://ddkk.com/zhuanlan/qianduan/react/15.html
- 分类：前端框架
- 分组：教程目录
Flux 的最大特点，就是数据的"单向流动"，任何相邻的部分都不会发生数据的"双向流动"

## Flux 构成元素

**Flux** 将一个应用划分为四个部分: - View： 视图层 - Action（动作）：视图层发出的消息（比如mouseClick） - Dispatcher（分发器）：用来接收Actions、执行回调函数 - Store（数据层）：用来存放应用的状态，一旦发生变动，就提醒Views要更新页面

Flux 的 **单向数据** 流程图

## Flux 单向数据流

**1、** 用户访问View；

**2、** View发出用户的Action；

**3、** Dispatcher收到Action，要求Store进行相应的更新；

**4、** Store更新后，发出一个"change"事件；

**5、** View收到"change"事件后，更新页面；

整个过程中，数据总是"单向流动"，任何相邻的部分都不会发生数据的"双向流动"。这保证了流程的清晰

## Flux 优点

- 单向数据流，简单易懂
- 程序简单，容易维护
- 解耦,降低应用各个部分相互依赖度.
