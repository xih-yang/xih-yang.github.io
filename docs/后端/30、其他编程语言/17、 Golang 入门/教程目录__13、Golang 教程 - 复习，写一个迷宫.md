# 13、Golang 教程 - 复习，写一个迷宫
- 来源：https://ddkk.com/zhuanlan/other/golang/3/13.html
- 分类：其他语言
- 分组：教程目录
```java
package main
import (
	"fmt"
	"os"
)
// 广度遍历
// 读取迷宫
func readMaze(filename string) [][]int {
	file, err := os.Open(filename)
	if err != nil {
		panic(err) //这里先不做处理
	}
	var row, col int                       // 行 列
	fmt.Fscanf(file, "%d %d ", &row, &col) // 这里要给row col赋值，所以取地址
	maze := make([][]int, row)
	for i := range maze {
      //row行
		maze[i] = make([]int, col) //每行col个
		for j := range maze[i] {
        // 赋值
			fmt.Fscanf(file, "%d", &maze[i][j])
		}
	}
	return maze
}
type point struct {
	i, j int
}
var dirs = [4]point{
      //上 左，下，右
	{
     -1, 0}, {
     0, -1}, {
     1, 0}, {
     0, 1},
}
func (p point) add(q point) point {
	return point{
     p.i + q.i, p.j + q.j}
}
func (p point) at(grid [][]int) (int, bool) {
	if p.i < 0 || p.j < 0 || p.i >= len(grid) || p.j >= len(grid[0]) {
		return 0, false
	}
	return grid[p.i][p.j], true
}
func work(maze [][]int, start, end point) [][]int {
	steps := make([][]int, len(maze))
	for i := range steps {
		steps[i] = make([]int, len(maze[i]))
	}
	Q := []point{
     start} //队列 并且把那个起点放进去
	for len(Q) > 0 {
		cur := Q[0] //取出队列头的数据
		Q = Q[1:]
		if cur == end {
			break
		}
		for _, dir := range dirs {
			next := cur.add(dir)
			val, ok := next.at(maze)
			if !ok || val == 1 {
				continue
			}
			val, ok = next.at(steps)
			if !ok || val != 0 {
				continue
			}
			if next == start {
				continue
			}
			curStep, _ := cur.at(steps)
			steps[next.i][next.j] = curStep + 1
			Q = append(Q, next)
		}
	}
	return steps
}
func main() {
	maze := readMaze("maze/maze/maze.in")
	for _, row := range maze {
		for _, val := range row {
			fmt.Printf("%d ", val)
		}
		fmt.Println()
	}
	steps := work(maze, point{
     0, 0}, point{
     len(maze) - 1, len(maze[0]) - 1})
	for _, row := range steps {
		for _, val := range row {
			fmt.Printf("%3d ", val)
		}
		fmt.Println()
	}
}
```
