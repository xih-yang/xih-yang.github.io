# 30、JavaScript 属性节点的获取attributes
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/30.html
- 分类：前端框架
- 分组：教程目录
attributes

功能：获取所有的属性节点

返回值：伪数组/数组 数据类型：对象 属性节点集合(NamedNodeMap)

属性节点集合(NamedNodeMap) :无序的、不重复的

node.attributes.getNameItem(‘属性名’)

功能：获取对应属性名的属性节点

返回值：属性节点 （属性名=属性值）

注：也可以直接通过访问相应的属性节点：

obox.attributes[‘属性名’])
