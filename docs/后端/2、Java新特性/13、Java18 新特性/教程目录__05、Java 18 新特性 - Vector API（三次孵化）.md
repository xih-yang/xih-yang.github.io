# 05、Java 18 新特性 - Vector API（三次孵化）
- 来源：https://ddkk.com/zhuanlan/java/java18/5.html
- 分类：Java 18 新特性
- 分组：教程目录
在Java 16 中引入一个新的 API 来进行向量计算，它可以在运行时可靠的编译为支持的 CPU 架构，从而实现更优的计算能力。

在Java 17 中改进了 Vector API 性能，增强了例如对字符的操作、字节向量与布尔数组之间的相互转换等功能。

现在在JDK 18 中将继续优化其性能。

## Java Vector API的使用测试

### Vector API

**Vector API** 是Java18开始引入的一个项目（[JEP 417](https://openjdk.org/jeps/417)），通过引入该API来表达向量运算，该计算在运行时可靠地编译为支持的CPU架构上的最优向量指令，从而实现优于等效标量计算的性能。

首先，简单说明一下[矢量运算](https://zhuanlan.zhihu.com/p/189589184)的基本概念，你可以简单理解为正常情况下我们使用的计算机是64位的，但是有时计算机可能需要同时处理多项任务时就意味着需要更多的位数，这其中可以通过以上链接了解到关于**预测寄存器**和**矢量寄存器**相关知识，其中矢量寄存器的位数可以在128位到2048位不等，比如我的计算机的SVE寄存器位256位，那我一次可以处理256/32(int所占位数)=8个数据，具体见下列代代码。

```java
void daxpy (double *x, double *y, double a, int n){
	for (int i= 0; i < n; i++)
	y[i] = a*x [i] + y[i];
}
```

- **p**表示预测寄存器
- **z**表示SVE寄存器

关于Vector API的部分说明：

**1、** 只支持**x64和AArch64**架构的CPU；

**2、** 目前只作用与**C2编译器**；

### 编写测试代码

该项目代码使用JMH进行测试，需要导入以下依赖

```java
		<!-- https://mvnrepository.com/artifact/org.openjdk.jmh/jmh-generator-annprocess -->
        <dependency>
            <groupId>org.openjdk.jmh</groupId>
            <artifactId>jmh-generator-annprocess</artifactId>
            <version>1.35</version>
            <scope>provided</scope>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.openjdk.jmh/jmh-core -->
        <dependency>
            <groupId>org.openjdk.jmh</groupId>
            <artifactId>jmh-core</artifactId>
            <version>1.35</version>
            <scope>provided</scope>
        </dependency>
```

```java
//VM Options: --add-modules jdk.incubator.vector
import jdk.incubator.vector.IntVector;
import jdk.incubator.vector.VectorSpecies;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.results.format.ResultFormatType;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Warmup(iterations = 3,time = 1,timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 3,time = 1,timeUnit = TimeUnit.SECONDS)
@Fork(1)
public class JMH {
    private int[] nums;
    @Param({
            "100",
            "1000",
            "10000",
            "100000",
            "1000000",
            "10000000",
            "100000000",
            "250000000"
    })
    int size;
    @Setup
    public void setup(){
        nums = new int[size];
    }
    @Benchmark
    public int[] StreamComputation(){
        int[] result = new int[size];
        Arrays.parallelSetAll(result, i -> (nums[i] * i + nums[i] * nums[i])*-1);
        return result;
    }
    @Benchmark
    public void ParallelComputation() throws InterruptedException {
        int[] result = new int[size];
        CountDownLatch count = new CountDownLatch(8);
        for (int i = 0; i < 8; i++) {
            final int start = i;
            new Thread(()->{
                for (int j = start; j < nums.length; j += 8) {
                    result[j] = (nums[j]*j+nums[j]*nums[j])*-1;
                }
                count.countDown();
            }).start();
        }
        count.await();
    }
    @Benchmark
    public int[] Vector128Computation(){
        int[] result = new int[size];
        VectorSpecies<Integer> species = IntVector.SPECIES_128;
        int loop = species.loopBound(nums.length);
        int i = 0;
        for (; i < loop;  i += species.length()) {
            IntVector va = IntVector.fromArray(species,nums,i);
            IntVector vb = IntVector.fromArray(species,nums,i);
            IntVector vc = va.mul(va)
                    .add(vb.mul(vb))
                    .neg();
            vc.intoArray(result,i);
        }
        for (; i < nums.length; i++) {
            result[i] = nums[i]*i+nums[i]*nums[i]*(-1);
        }
        return result;
    }
    @Benchmark
    public int[] Vector256Computation(){
        int[] result = new int[size];
        VectorSpecies<Integer> species = IntVector.SPECIES_256;
        int loop = species.loopBound(nums.length);
        int i = 0;
        for (; i < loop;  i += species.length()) {
            IntVector va = IntVector.fromArray(species,nums,i);
            IntVector vb = IntVector.fromArray(species,nums,i);
            IntVector vc = va.mul(va)
                    .add(vb.mul(vb))
                    .neg();
            vc.intoArray(result,i);
        }
        for (; i < nums.length; i++) {
            result[i] = nums[i]*i+nums[i]*nums[i]*(-1);
        }
        return result;
    }
    @Benchmark
    public int[] Vector512Computation(){
        int[] result = new int[size];
        VectorSpecies<Integer> species = IntVector.SPECIES_512;
        int loop = species.loopBound(nums.length);
        int i = 0;
        for (; i < loop;  i += species.length()) {
            IntVector va = IntVector.fromArray(species,nums,i);
            IntVector vb = IntVector.fromArray(species,nums,i);
            IntVector vc = va.mul(va)
                    .add(vb.mul(vb))
                    .neg();
            vc.intoArray(result,i);
        }
        for (; i < nums.length; i++) {
            result[i] = nums[i]*i+nums[i]*nums[i]*(-1);
        }
        return result;
    }
    @Benchmark
    public int[] defaultComputation(){
        int[] result = new int[size];
        for (int i = 0; i < nums.length; i++) {
            result[i] = (nums[i]*i+nums[i]*nums[i])*-1;
        }
        return result;
    }
    public static void main(String[] args) throws RunnerException, IOException {
        Options opts = new OptionsBuilder()
                .include(JMH.class.getSimpleName())
                .resultFormat(ResultFormatType.JSON)
                .output(new File("jmh.log").getCanonicalPath())
                .build();
        new Runner(opts).run();
    }
}
```

### 测试结果

```java
Benchmark                    (size)  Mode  Cnt        Score         Error  Units
JMH.ParallelComputation         100  avgt    3       29.676 ±       3.856  us/op
JMH.ParallelComputation        1000  avgt    3       32.549 ±      28.265  us/op
JMH.ParallelComputation       10000  avgt    3       45.063 ±       9.727  us/op
JMH.ParallelComputation      100000  avgt    3      219.920 ±      37.503  us/op
JMH.ParallelComputation     1000000  avgt    3     2070.604 ±     700.193  us/op
JMH.ParallelComputation    10000000  avgt    3    15660.505 ±    2796.283  us/op
JMH.ParallelComputation   100000000  avgt    3   256957.510 ± 1039982.820  us/op
JMH.ParallelComputation   250000000  avgt    3   652928.650 ±  175108.941  us/op
JMH.StreamComputation           100  avgt    3        8.579 ±       1.535  us/op
JMH.StreamComputation          1000  avgt    3        9.602 ±       0.726  us/op
JMH.StreamComputation         10000  avgt    3       20.908 ±       3.043  us/op
JMH.StreamComputation        100000  avgt    3       78.725 ±      15.190  us/op
JMH.StreamComputation       1000000  avgt    3     1080.335 ±     444.759  us/op
JMH.StreamComputation      10000000  avgt    3     7989.456 ±    3523.566  us/op
JMH.StreamComputation     100000000  avgt    3    77524.201 ±   30073.807  us/op
JMH.StreamComputation     250000000  avgt    3   192820.889 ±    7839.996  us/op
JMH.Vector128Computation        100  avgt    3        0.061 ±       0.007  us/op
JMH.Vector128Computation       1000  avgt    3        0.643 ±       0.048  us/op
JMH.Vector128Computation      10000  avgt    3        6.323 ±       0.553  us/op
JMH.Vector128Computation     100000  avgt    3       59.549 ±      34.958  us/op
JMH.Vector128Computation    1000000  avgt    3     1174.302 ±     404.046  us/op
JMH.Vector128Computation   10000000  avgt    3     8473.528 ±    1039.583  us/op
JMH.Vector128Computation  100000000  avgt    3    82410.628 ±   19711.603  us/op
JMH.Vector128Computation  250000000  avgt    3   205339.393 ±   52689.755  us/op
JMH.Vector256Computation        100  avgt    3        0.073 ±       0.012  us/op
JMH.Vector256Computation       1000  avgt    3        0.591 ±       0.034  us/op
JMH.Vector256Computation      10000  avgt    3        5.700 ±       1.486  us/op
JMH.Vector256Computation     100000  avgt    3       56.608 ±      13.098  us/op
JMH.Vector256Computation    1000000  avgt    3     1139.838 ±     273.834  us/op
JMH.Vector256Computation   10000000  avgt    3     8321.221 ±    4300.157  us/op
JMH.Vector256Computation  100000000  avgt    3    82288.278 ±   45482.083  us/op
JMH.Vector256Computation  250000000  avgt    3   204230.229 ±   89249.522  us/op
JMH.Vector512Computation        100  avgt    3        0.587 ±       0.056  us/op
JMH.Vector512Computation       1000  avgt    3        6.084 ±       1.852  us/op
JMH.Vector512Computation      10000  avgt    3       64.068 ±       2.557  us/op
JMH.Vector512Computation     100000  avgt    3      612.263 ±      93.553  us/op
JMH.Vector512Computation    1000000  avgt    3     6541.734 ±    5697.026  us/op
JMH.Vector512Computation   10000000  avgt    3    61163.729 ±   11045.924  us/op
JMH.Vector512Computation  100000000  avgt    3   767615.083 ±  241938.527  us/op
JMH.Vector512Computation  250000000  avgt    3  1632611.033 ± 1793126.085  us/op
JMH.defaultComputation          100  avgt    3        0.105 ±       0.008  us/op
JMH.defaultComputation         1000  avgt    3        0.936 ±       0.059  us/op
JMH.defaultComputation        10000  avgt    3        9.323 ±       0.311  us/op
JMH.defaultComputation       100000  avgt    3       77.149 ±      11.756  us/op
JMH.defaultComputation      1000000  avgt    3     1308.792 ±     828.180  us/op
JMH.defaultComputation     10000000  avgt    3     9623.205 ±    3032.074  us/op
JMH.defaultComputation    100000000  avgt    3    92491.573 ±   17694.014  us/op
JMH.defaultComputation    250000000  avgt    3   225411.133 ±   18094.859  us/op
```
