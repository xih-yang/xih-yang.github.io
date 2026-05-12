# 06、Golang 教程 - 内建容器
- 来源：https://ddkk.com/zhuanlan/other/golang/3/6.html
- 分类：其他语言
- 分组：教程目录
## 数组

```java
func main() {
	//数组的定义方式
	//[0,0,0]
	var nums1 [3]int
	nums2 := [3]int{
     1, 2, 3}
	// 如果要让编译器判断我们有几个元素，要用...  没有...是切片
	nums3 := [...]int{
     3, 4, 5}
	fmt.Println(nums1, nums3, nums2)
	// 遍历方式
	// 第一种
	for i:=0;i<len(nums3);i++{
		fmt.Println(nums3[i])
	}
	// i为索引
	for i :=range nums2{
		fmt.Println(i)
	}
	// i为索引 v为值
	for i, v:=range nums2{
		fmt.Println(i,v)
	}
	// 丢弃索引
	for _, v:=range nums2{
		fmt.Println(v)
	}
	// 数组是值类型
}
// 数组是值类型，作为参数会拷贝整个数组
// [3]int [5]int是不同的类型，这个函数只能传入[5]int类型
// 数组是值类型，所以在函数内修改数组的值并不会影响到实参
func printArray(arr [5]int) {
 arr[3] = 100 //不会影响到实参
}
func printArray2(arr *[5]int) {
      //传入指针
	arr[3] = 100 //这样就可以改变值，很灵活，不用在arr前面加上*
	(*arr)[3] = 100 // 这样也可以
}
// 在go语言中一般不直接使用数组
```

## 切片-Slice

```java
func main() {
	// 切片 左开右闭
	arrList := [7]int{
     1,2,3,4,5,6,7}
	arr := arrList[:] // 定义一个切片
	arr1 := arrList[2,6] // arr1 [3,4,5,6]
	arr1[0] = 22  //arrList [1,2,22,4,5,6,7]
	sliceLearn(arr) //arrList [22,2,22,4,5,6,7]
	//切片可以对切片处理
	arr3 := arr1[1,3] //arr3 [4,5]
	arr4 := arr3[0:4] // arr4 [4,5,6,7]
}
// slice 切片
// slice相当于数组的一个view
// slice 定义 arr []int
func sliceLearn(arr []int){
	arr[0]=22 // 会改变值，而且会影响实参数
}
//Slice本身没有数据，是对底层array的一个view
```

- Slice的实现

```java
// slice可以向后扩展，但不可以向前扩展
struct {
	ptr // 指向数组中切片第一个元素的指针
	len //slice视图的数据
	cap // 底层数组的长度
}
// reslice 扩展不能超过cap的长度 s[i] 不能超过len的长度
// %v value的值 %T 类型
// 一个切片s可以扩展到他的大小上限：s = s[:cap(s)], 如果再扩大的话就会报运行时错误
```

- slice的一些操作

```java
// 向Slice添加元素
// 添加元素时如果超过了cap，系统会重新分配更大的底层数组 然后把值拷贝过去
func main() {
	arr := [6]int{
     1, 2, 3, 4, 5, 6}
	slice1 := arr[2:5]
	slice2 := append(slice1, 11)        // 把6变成11
	slice3 := append(slice2, 12)        //分配一个更长的arr 然后slice3 view他
	fmt.Println(slice1, slice2, slice3) // [3 4 5] [3 4 5 11] [3 4 5 11 12]
	fmt.Println(arr)                    //[1 2 3 4 5 11]
	// 由于是值传递，所以必须接收append的值
	// 直接创建slice
	var s []int             // nil
	s1 := []int{
     2, 3, 4, 5} // 这样也可以
	s2 := make([]int, 16)
	s3 := make([]int, 16, 32)
	for i := 0; i < 100; i++ {
		printSlice(s)
		s = append(s, 2*i)
	}
	fmt.Println(s)
	copy(s2,s1) // dst scr
	//删除一个元素
	s2 = append(s2[:3],s2[4:]...)//把位置为3的删掉
	s2 = s2[1:] //删除头
	s2 = s2[:len(s2)-1] //删除尾
}
func printSlice(s []int) {
	fmt.Printf(" len=%d, cap=%d\n", len(s), cap(s))
	// len=6, cap=8
	// len=7, cap=8
	// len=8, cap=8
	// len=9, cap=16
	// len=10, cap=16
}
```

## Map

```java
map[k]V
map[k]map[k2]V
```

```java
func main() {
	m1 := map[string]string{
		"aa": "bb",
		"bb": "cc",
	}
	m2 := make(map[string]string) // m2 == empty map
	var m3 map[string]string      //m3 == nil
	fmt.Println(m1, m2, m3) //map[aa:bb bb:cc] map[] map[]
	//遍历 无序 每次顺序不一样
	for k, v := range m1 {
		fmt.Println(k, v)
	}
	// key
	for k := range m1 {
		fmt.Println(k)
	}
	// 打印一个不存在的key 会是zero value
	fmt.Println(m1["abc"])
	courseName, ok := m2["abc"] // 第二个为true 表示值存在，false表示不存在
	fmt.Println(courseName, ok) // false
	delete(m1,"abc") // 删除元素
}
```

- 创建:make(map[string]int)
- 获取元素 m[key]
- key不存在时获取value类型的初始值
- 用value, ok := m[key]来判断是否存在key
- 用delete删除一个key
- map遍历不保证顺序，可以用len来获取个数
- map使用的是哈希表，key必须可以比较相等
- 除了slice, map, function的内建类型都可以作为key
- struct类型不包含上述字段，也可以作为key
- 每个rune是4个字节，转rune 不是对原有的内存存的东西进行解释，而是重新开一个内存，然后解释后存起来

## rune

- rune相当于go的char
- 使用range遍历pos（索引不连续），rune（索引连续）对
- 使用utf8.RuneCountInString获得字符数量
- 使用len获得字节长度
- 使用[]byte获得字节

```java
func main() {
	s := "yes！肖小小最棒"
	fmt.Printf("%s\n", []byte(s)) //yes！肖小小最棒
	for _, b := range []byte(s) {
		// utf-8 可变长
		fmt.Printf("%X ", b) //79 65 73 EF BC 81 E8 82 96 E5 B0 8F E5 B0 8F E6 9C 80 E6 A3 92
	}
	fmt.Println()
	for i, ch := range s {
      // ch is a rune
		// i为索引 第几个字节开始 ch为unicode编码
		//(0,79)(1,65)(2,73)(3,FF01)(6,8096)(9,5C0F)(12,5C0F)(15,6700)(18,68D2)
		fmt.Printf("(%d,%X)", i, ch)
	}
	fmt.Println()
	// 9
	fmt.Println(utf8.RuneCountInString(s))
	bytes := []byte(s)
	for len(bytes) > 0 {
		ch, size := utf8.DecodeRune(bytes) // ch is rune  size 为ch的字节长度
		bytes = bytes[size:]
		fmt.Printf("%c", ch)
	}
	fmt.Println()
	for i, ch := range []rune(s) {
		// 下标连续
		// (0,y)(1,e)(2,s)(3,！)(4,肖)(5,小)(6,小)(7,最)(8,棒)
		fmt.Printf("(%d,%c)", i, ch)
	}
	fmt.Println()
}
```
