# 28、Golang 教程 - go中的OOP-多态
- 来源：https://ddkk.com/zhuanlan/other/golang/4/28.html
- 分类：其他语言
- 分组：教程目录
Go中的多态性是在接口`interface`的帮助下实现的。正如我们已经讨论过的，接口可以在Go中隐式实现。如果一个类型定义了某个接口中声明的所有方法，则该类型实现了这个接口。让我们看看，利用接口，如何在Go中实现多态性。

## 使用接口实现多态#

任何一种类型，如何定义了某个接口中声明的所有方法，那么该类型就隐式实现了这个接口。

接口类型的变量可以保存实现该接口的任何值。接口的这个特性用于实现GO的多态性。

让我们通过一个计算公司的净收入的程序来了解Go的多态。为简单起见，让我们假设该公司有两种收入途径：固定计费和按时间计费。公司净收入是这两种途径之和。我们假设货币是美元，我们不会处理美分。它将使用int表示。(我建议阅读https://forum.golangbridge.org/t/what-is-the-proper-golang-equivalent-to-decimal-when-dealing-with-money/413以了解如何代表美分。感谢Andreas Matuschek在评论部分指出了这一点)。

我们首先定义一个接口`Income`。

```java
type Income interface {
    calculate() int
    source() string
}
```

接口`Income`定义两个方法：`calculate()`用于计算并返回资源的收入，`source()`返回资源的名称。

接下来定义一个结构体`FixedBilling`，表示固定计费：

```java
type FixedBilling struct {
    projectName string
    biddedAmount int
}
```

`FixedBilling`项目有两个字段`projectName`, 它代表项目的名称, `biddedAmount`, 它表示项目的投标金额。

定义结构体`TimeAndMaterial`，表示按时间计费：

```java
type TimeAndMaterial struct {
    projectName string
    noOfHours  int
    hourlyRate int
}
```

`TimeAndMaterial`结构有三个字段名称`projectName`(项目的名称)、`noOfHours`(总时长) 和 `hourlyRate`(每小时多少钱).

下一步是定义这些结构类型的方法，这些方法计算并返回实际收入和项目名称。

```java
func (fb FixedBilling) calculate() int {
    return fb.biddedAmount
}
func (fb FixedBilling) source() string {
    return fb.projectName
}
func (tm TimeAndMaterial) calculate() int {
    return tm.noOfHours * tm.hourlyRate
}
func (tm TimeAndMaterial) source() string {
    return tm.projectName
}
```

对于`FixedBilling`项目而言, 收入就是项目的投标金额。因此, 我们从`FixedBilling`类型的`calculate()`方法中返回此项。

对于`TimeAndMaterial`项目, 收入等于 `noOfHours` 和 `hourlyRate` 的乘积。此值从接收器类型为`TimeAndMaterial`的`calculate()`方法返回。

我们还通过 `source()` 方法返回了表示收入来源的项目名称。

由于`FixedBilling` 和 `TimeAndMaterial` 两个结构体都定义了 `Income` 接口的两个方法：`calculate()` 和 `source()`，因此这两个结构体都实现了 `Income` 接口。

我们来声明一个 `calculateNetIncome` 函数，用来计算并打印总收入。

```java
func calculateNetIncome(ic []Income) {
    var netincome int = 0
    for _, income := range ic {
        fmt.Printf("Income From %s = $%d\n", income.source(), income.calculate())
        netincome += income.calculate()
    }
    fmt.Printf("Net income of organisation = $%d", netincome)
}
```

上面的函数接收一个 `Income` 接口类型的切片作为参数。它通过遍历切片并调用每一个`calculate()`方法来计算总收入。它还通过调用`source()`方法来显示收入来源。根据`Income`接口的具体类型, 将调用不同的`calculate()`和`source()`方法。因此, 我们已经在`calculateNetIncome`函数中实现了多态。

将来如果公司增加了一种新的收入途径, 这个函数仍然可以正确计算总收入, 而不需要修改任何一行代码。

程序还剩下一个主函数：

```java
func main() {
    project1 := FixedBilling{
     projectName: "Project 1", biddedAmount: 5000}
    project2 := FixedBilling{
     projectName: "Project 2", biddedAmount: 10000}
    project3 := TimeAndMaterial{
     projectName: "Project 3", noOfHours: 160, hourlyRate: 25}
    incomeStreams := []Income{
     project1, project2, project3}
    calculateNetIncome(incomeStreams)
}
```

在上面的`main`函数中，我们创建了三个项目，两个`FixedBilling`类型和一个`TimeAndMaterial`类型。接下来，我们使用这`3`个项目创建一个`Income`类型的切片。由于每个项目都实现了`Income`接口，因此可以将这三个项目添加到一个`Income`类型的切片中。最后，我们用这个切片作为参数调用函数`calculateNetIncome`，它将显示各种项目的名称 和他们的收入。

这是完整的程序供您参考:

```java
package main
import (  
    "fmt"
)
type Income interface {
    calculate() int
    source() string
}
type FixedBilling struct {
    projectName string
    biddedAmount int
}
type TimeAndMaterial struct {
    projectName string
    noOfHours  int
    hourlyRate int
}
func (fb FixedBilling) calculate() int {
    return fb.biddedAmount
}
func (fb FixedBilling) source() string {
    return fb.projectName
}
func (tm TimeAndMaterial) calculate() int {
    return tm.noOfHours * tm.hourlyRate
}
func (tm TimeAndMaterial) source() string {
    return tm.projectName
}
func calculateNetIncome(ic []Income) {
    var netincome int = 0
    for _, income := range ic {
        fmt.Printf("Income From %s = $%d\n", income.source(), income.calculate())
        netincome += income.calculate()
    }
    fmt.Printf("Net income of organisation = $%d", netincome)
}
func main() {
    project1 := FixedBilling{
     projectName: "Project 1", biddedAmount: 5000}
    project2 := FixedBilling{
     projectName: "Project 2", biddedAmount: 10000}
    project3 := TimeAndMaterial{
     projectName: "Project 3", noOfHours: 160, hourlyRate: 25}
    incomeStreams := []Income{
     project1, project2, project3}
    calculateNetIncome(incomeStreams)
}
```

该程序将输出

```java
Income From Project 1 = $5000  
Income From Project 2 = $10000  
Income From Project 3 = $4000  
Net income of organisation = $19000 
```

## 程序添加新的收入途径#

假设该公司找到了新的收入途径 - 广告。让我们看看添加这个新的收入途径并计算总收入是多么简单，由于多态性，不需要对`calculateNetIncome`函数进行任何更改。

我们先定义一个`ADvertisement`结构体，并定义`calculate()`和`source()`方法。

```java
type Advertisement struct {
    adName     string
    CPC        int
    noOfClicks int
}
func (a Advertisement) calculate() int {
    return a.CPC * a.noOfClicks
}
func (a Advertisement) source() string {
    return a.adName
}
```

`Advertisement`类型有三个字段`adName`(广告名称)、 `CPC` (每次点击价钱) 和`noOfClicks` (点击次数)。来自广告的总收入是`CPC`和`noOfClicks`的乘积。.

让我们稍微修改一下`main`函数, 以包括这个新的收入途径。

```java
func main() {
    project1 := FixedBilling{
     projectName: "Project 1", biddedAmount: 5000}
    project2 := FixedBilling{
     projectName: "Project 2", biddedAmount: 10000}
    project3 := TimeAndMaterial{
     projectName: "Project 3", noOfHours: 160, hourlyRate: 25}
    bannerAd := Advertisement{
     adName: "Banner Ad", CPC: 2, noOfClicks: 500}
    popupAd := Advertisement{
     adName: "Popup Ad", CPC: 5, noOfClicks: 750}
    incomeStreams := []Income{
     project1, project2, project3, bannerAd, popupAd}
    calculateNetIncome(incomeStreams)
}
```

我们已经创建了两个广告，即`bannerAd`和`popupAd`。`incomeStreams`切片中包括我们刚刚创建的两个广告。

这是添加广告后的完整程序。

```java
package main
import (  
    "fmt"
)
type Income interface {
    calculate() int
    source() string
}
type FixedBilling struct {
    projectName  string
    biddedAmount int
}
type TimeAndMaterial struct {
    projectName string
    noOfHours   int
    hourlyRate  int
}
type Advertisement struct {
    adName     string
    CPC        int
    noOfClicks int
}
func (fb FixedBilling) calculate() int {
    return fb.biddedAmount
}
func (fb FixedBilling) source() string {
    return fb.projectName
}
func (tm TimeAndMaterial) calculate() int {
    return tm.noOfHours * tm.hourlyRate
}
func (tm TimeAndMaterial) source() string {
    return tm.projectName
}
func (a Advertisement) calculate() int {
    return a.CPC * a.noOfClicks
}
func (a Advertisement) source() string {
    return a.adName
}
func calculateNetIncome(ic []Income) {
    var netincome int = 0
    for _, income := range ic {
        fmt.Printf("Income From %s = $%d\n", income.source(), income.calculate())
        netincome += income.calculate()
    }
    fmt.Printf("Net income of organisation = $%d", netincome)
}
func main() {
    project1 := FixedBilling{
     projectName: "Project 1", biddedAmount: 5000}
    project2 := FixedBilling{
     projectName: "Project 2", biddedAmount: 10000}
    project3 := TimeAndMaterial{
     projectName: "Project 3", noOfHours: 160, hourlyRate: 25}
    bannerAd := Advertisement{
     adName: "Banner Ad", CPC: 2, noOfClicks: 500}
    popupAd := Advertisement{
     adName: "Popup Ad", CPC: 5, noOfClicks: 750}
    incomeStreams := []Income{
     project1, project2, project3, bannerAd, popupAd}
    calculateNetIncome(incomeStreams)
}
```

以上程序将输出，

```java
Income From Project 1 = $5000  
Income From Project 2 = $10000  
Income From Project 3 = $4000  
Income From Banner Ad = $1000  
Income From Popup Ad = $3750  
Net income of organisation = $23750 
```

您会注意到，虽然我们添加了新的收入途径，但我们没有对`calculateNetIncome`函数进行任何更改。这是因为多态性而起作用。由于新类型`Advertisement`也实现了`Income`接口，我们可以将它添加到`incomeStreams`切片中。该`calculateNetIncome`函数也没有任何变化，因为它能够调用`Advertisement`类型的`calculate()`和`source()`方法。
