# 13、 Golang 设计模式：13_享元模式
- 来源：https://ddkk.com/zhuanlan/design/golang/13.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 运用共享技术有效地支持大量细粒度的对象。

享元（Flyweight）的核心思想很简单：如果一个对象实例一经创建就不可变，那么反复创建相同的实例就没有必要，直接向调用方返回一个共享的实例就行，这样即节省内存，又可以减少创建对象的过程，提高运行速度。

**单例模式和享元模式都是为了避免重复创建对象，但是其本质是不一样的：**

其实现方式不一样，单例是一个类只有一个唯一的实例，而享元可以有多个实例，只是通过一个共享容器来存储不同的对象。

其使用场景不一样，单例是强调减少实例化提升性能，因此一般用于一些需要频繁创建和销毁实例化对象或创建和销毁实例化对象非常消耗资源的类中，如连接池、线程池。而享元则是强调共享相同对象或对象属性，节约内存使用空间。

## 2、示例

示例代码：

```java
package main
import "fmt"
//轻量级图片
type ImageFlyweight struct {
	data string
}
func (i *ImageFlyweight) Data() string {
	return i.data
}
func NewImageFlyweight(fileName string) *ImageFlyweight {
	d := fmt.Sprintf("image data:%s", fileName)
	return &ImageFlyweight{
		data: d,
	}
}
//imageFactory
type ImageFlyweightFactory struct {
	maps map[string]*ImageFlyweight
}
func (f *ImageFlyweightFactory) Get(fileName string) *ImageFlyweight {
	image := f.maps[fileName]
	if image == nil {
		image = NewImageFlyweight(fileName)
		f.maps[fileName] = image
	}
	return image
}
var imageFactory *ImageFlyweightFactory //全局变量，共享
func GetImageFlyweightFactory() *ImageFlyweightFactory {
	//防止重复创建
	if imageFactory == nil {
		imageFactory = &ImageFlyweightFactory{maps: make(map[string]*ImageFlyweight)}
	}
	return imageFactory
}
//图片浏览器
type ImageViewer struct {
	*ImageFlyweight
}
func (i *ImageViewer) Display() {
	fmt.Printf("显示图片：%v\n", i.data)
}
func NewImageViewer(filename string) *ImageViewer {
	imageFlyweight :=GetImageFlyweightFactory().Get(filename)
	return &ImageViewer{
		ImageFlyweight: imageFlyweight,
	}
}
func main() {
	imageViewer := NewImageViewer("image1.png")
	imageViewer.Display()
	viewer1 := NewImageViewer("img1")
	viewer2 := NewImageViewer("img1")
	if *viewer1==*viewer2 { //2个指针指向同一个地址，共享模式
		fmt.Println("共享模式")
	}else {
		fmt.Println("非共享模式")
	}
}
```

UML图：
