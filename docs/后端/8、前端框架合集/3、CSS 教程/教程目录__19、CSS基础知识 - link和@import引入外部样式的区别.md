# 19、CSS基础知识 - link和@import引入外部样式的区别
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/19.html
- 分类：前端框架
- 分组：教程目录
**link和@import引入外部样式的区别**

（1）link属于HTML标签，而@import完全是CSS提供的一种方式。

（2）当页面被加载的时候，link引用的CSS会同时被加载，而@import引用的CSS 会等到页面全部被下载完再被加载。

（3）由于@import是CSS2.1提出的，@import只有在IE5以上的才能识别，而link标签无此问题。
