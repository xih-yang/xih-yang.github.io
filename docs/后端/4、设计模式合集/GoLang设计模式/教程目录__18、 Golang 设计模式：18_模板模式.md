# 18、 Golang 设计模式：18_模板模式
- 来源：https://ddkk.com/zhuanlan/design/golang/18.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 定义一个操作中的算法的骨架，而将一些步骤延迟到子类中，使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。

模板方法（Template Method）是一个比较简单的模式。它的主要思想是，定义一个操作的一系列步骤，对于某些暂时确定不下来的步骤，就留给子类去实现好了，这样不同的子类就可以定义出不同的步骤。

因此，模板方法的核心在于定义一个“骨架”。

#### 模版方法模式的结构

模版方法模式由一个抽象类和一个（或一组）实现类通过继承结构组成，抽象类中的方法分为三种：

**抽象方法**：父类中只声明但不加以实现，而是定义好规范，然后由它的子类去实现。

**模版方法**：由抽象类声明并加以实现。一般来说，模版方法调用抽象方法来完成主要的逻辑功能，并且，模版方法大多会定义为final类型，指明主要的逻辑功能在子类中不能被重写。

**钩子方法**：由抽象类声明并加以实现。但是子类可以去扩展，子类可以通过扩展钩子方法来影响模版方法的逻辑。

抽象类的任务是搭建逻辑的框架，通常由经验丰富的人员编写，因为抽象类的好坏直接决定了程序是否稳定性。

实现类用来实现细节。抽象类中的模版方法正是通过实现类扩展的方法来完成业务逻辑。只要实现类中的扩展方法通过了单元测试，在模版方法正确的前提下，整体功能一般不会出现大的错误。

## 2、示例

示例代码：

```java
package main
import "fmt"
type DownLoader interface {
	Download(uri string)
}
//具体实施
type implement interface {
	download()
	save()
}
//模板
type template struct {
	implement
	uri string
}
func (t *template) Download(uri string) {
	t.uri = uri
	fmt.Println("准备下载")
	t.implement.download()
	t.implement.save()
	fmt.Println("下载完成")
}
func (t *template) save() {
	fmt.Println("默认保存")
}
func newTemplate(impl implement) *template {
	return &template{
		implement: impl,
		uri:       "",
	}
}
//===============HTTP下载器================
type HttpDownloader struct {
	*template
}
func (hd *HttpDownloader) download() {
	fmt.Printf("正在通过HTTP下载：%v\n", hd.uri)
}
func (*HttpDownloader) save() {
	fmt.Println("HTTP保存")
}
func NewHttpDownloader() *HttpDownloader {
	downloader := &HttpDownloader{}
	template := newTemplate(downloader)
	downloader.template = template
	return downloader
}
//===============FTP下载器================
type FtpDownloader struct {
	*template
}
func (hd *FtpDownloader) download() {
	fmt.Printf("正在通过HTTP下载：%v\n", hd.uri)
}
func (*FtpDownloader) save() {
	fmt.Println("HTTP保存")
}
func NewFtpDownloader() *FtpDownloader {
	downloader := &FtpDownloader{}
	template := newTemplate(downloader)
	downloader.template=template
	return downloader
}
func main() {
	httpDownloader := NewHttpDownloader()
	httpDownloader.Download("www.baidu.com/abc.zip")
	ftpDownloader := NewFtpDownloader()
	ftpDownloader.Download("www.163.com/abc.mp4")
}
```

UML图：
