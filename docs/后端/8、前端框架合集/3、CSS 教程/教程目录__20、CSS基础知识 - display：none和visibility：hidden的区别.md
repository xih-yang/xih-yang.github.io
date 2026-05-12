# 20、CSS基础知识 - display：none和visibility：hidden的区别
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/20.html
- 分类：前端框架
- 分组：教程目录
**display：none和visibility：hidden的区别**

（1）display: none隐藏后的元素不占据任何空间，无法使用屏幕阅读器等辅助设备访问，而visibility: hidden隐藏后的元素空间依旧保留

（2）visibility具有继承性，给父元素设置visibility:hidden;子元素也会继承这个属性。但是如果重新给子元素设置visibility: visible,则子元素又会显示出来。display: none非继承性，重新设置子元素也不会显示

（3）visibility: hidden不会影响计数器的计数（li），但是display会

（4）CSS3的transition支持visibility属性，但是并不支持display，由于transition可以延迟执行，因此可以配合visibility使用纯css实现hover延时显示效果。提高用户体验。

（5）display:none是会有回流，但是visibility: hidden; 是不会有回流（渲染树的一部分必须要更新且节点的尺寸发生了变化，会触发重排操作。每个页面至少在初始化的时候会有一次重排操作。部分节点需要更新，但没有改变其形状，会触发重绘操作。）
