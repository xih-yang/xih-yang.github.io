# 10、数据结构与算法 - 实战：斐波那契数列Fibonacci
- 来源：https://ddkk.com/zhuanlan/algorithm/12/10.html
- 分类：数据结构
- 分组：教程目录
Fibonacci数列特点

头两个元素都为1

从第三个元素起，当前元素数值为前两个元素的数值和

例如：1, 1, 2, 3, 5, 8, 13 .........

**总结了四种方法生成Fibonacci数列 - 有3种是递归、有1种不使用递归**

```java
public class FibonacciUtil {
    // 返回斐波那契数列第index个位置的数字
    public static int fiboNum(int index) {
        if(index == 1 || index == 2) {
            return 1;
        }else {
            return fiboNum(index-1) + fiboNum(index-2);
        }
    }
    /**
     *
     * @param length   斐波那契数列的长度
     * @param fiboArr  保存到某个固定长度空数组中 - length与foboArr长度必须对应
     * @return  返回的还是形参fiboArr对象
     */
    public static  int[]  fibonacci(int length, int[] fiboArr) {
        if(length == 1 ) {
            fiboArr[0] = 1;
        }else if(length == 2 ) {
            fiboArr[0] = 1;
            fiboArr[1] = 1;
        }else {
            fiboArr[length-1] = fibonacci(length-1, fiboArr)[length-2] + fibonacci(length-2, fiboArr)[length-3];
        }
        return fiboArr;
    }
    /**
     *
     * @param length
     * @return 返回一个length长的fibonacci数组
     */
    public static int[] fibonacci2(int length) {
        int[] fibos = new int[length];
        for(int index = 0; index<length; index++) {
            fibos[index] = fiboNum(index+1);
        }
        return fibos;
    }
    /**
     *
     * @param maxValue 斐波那契数列最后一个元素 大于 等于该元素
     * @return
     */
    public static Integer[] fibonacci3(int maxValue) {
        List<Integer> fiboList = new ArrayList<>();
        int length = 1;
        while(true)  {
            int fiboNum = fiboNum(length);
            fiboList.add(fiboNum);
            if(fiboNum >= maxValue)
                break;
            length++;
        }
        Integer[] fiboNums = new Integer[fiboList.size()];
        return fiboList.toArray(fiboNums);
    }
    /**
     * 不使用递归
     * @param length
     * @return 返回一个length长的fibonacci数组
     */
    public static int[] fibonacci4(int length) {
        int[] fiboNums = new int[length];
        if(length > 0) {
            fiboNums[0] = 1;
        }
        if(length > 1) {
            fiboNums[1] = 1;
        }
        if(length > 2) {
            int index = 2;
            while(true) {
                fiboNums[index] = fiboNums[index-1] + fiboNums[index-2];
                if(index+1 == length)
                    break;
                index++;
            }
        }
        return fiboNums;
    }
    public static void main(String[] args) {
        int[] fibonacci = fibonacci(10, new int[10]);
        System.out.println(Arrays.toString(fibonacci));
        int[] fibonacci2 = fibonacci2(10);
        System.out.println(Arrays.toString(fibonacci2));
        Integer[] fibonacci3 =  fibonacci3(100);
        System.out.println(Arrays.toString(fibonacci3));
        int[] fibonacci4 = fibonacci4(10);
        System.out.println(Arrays.toString(fibonacci4));
    }
}
```
