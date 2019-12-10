---
title: IO Monad 设计浅析（一）：Monad 和 MonadError
author: Jilen
tags:
- ~IO Monad 设计浅析
- 函数式编程
- ^Jilen
description: ZIO 是最近 Scala 社区非常热门且与众不同的 IO Monad 实现，本专题我们会从各个角度分析 ZIO 和 Cats-Effect 等 IO Monad 的设计。
date: 2019-12-09
---

ZIO 是最近 Scala 社区非常热门且与众不同的 IO Monad 实现，本专题我们会从各个角度分析 ZIO 和 Cats-Effect 等 IO Monad 的设计。

## 一个简单的 IO Monad 方案

对于 `Monad`, 大家都很熟悉：

```scala
trait Monad[F[_]] {
  def flatMap[A, B](fa: F[A])(f: A => F[B]): F[B]
  def pure[A](x: A): F[A]
}
```

是一个定义了函数 `flatMap` 和 `pure` 的很常见的 Typeclass（也有其他的形式，就不具体讨论了）。


可以看到，`Monad` 通常来说只有一个类型参数。例如我们最常见的 `List`，就是一个典型的 `Monad`。


> 注意，当我们说 `List` 是一个 `Monad` 的时候，是指我们可以实现一个 `List` 的 `Monad` 实例，并且这个实例满足 `Monad` 相关的 Laws。

同样的，IO Monad 也是 Monad，特别的是，它可以隔离副作用。


假如要自己设计一个简单的 IO Monad，我们脑子里通常会冒出这样的方案：

```scala
object IO {
  private case class Pure[A](value: A) extends IO[A]
  private case class FlatMap[A, B](fa: IO[A], f: A => IO[B]) extends IO[B]
  private case class Effect[A](run: () => A) extends IO[A]

  def effect[A](f: () => A): IO[A] = Effect(f)

  implicit val ioMonadInstance: Monad[IO] = new Monad[IO] with StackSafeMonad[IO] {
    def pure[A](x: A) = IO.Pure(x)
    def flatMap[A, B](fa: IO[A])(f: A => IO[B]): IO[B] = FlatMap(fa, f)
  }
}

sealed trait IO[A] {
  def unsafeRun(): A = this match {
    case IO.Pure(a) => a
    case IO.FlatMap(fa, f) => f(fa.unsafeRun).unsafeRun
    case IO.Effect(run) => run()
  }
}
```

这是比较常见的以 ADT 形式描述程序的数据类型。


其中 `Effect` 子类型提供了非常朴素的副作用隔离功能，它简单的把执行副作用的代码保存在一个无参函数中，从而达到延迟执行效果。


同时，它还定义了 cats 的 `Monad` 实例， 从而我们就可以用 cats 提供的 Monad 相关的任何操作。


`IO` 除了 `unsafeRun` 以外的所有操作都是纯函数，按照 FP 的潜规则，所有的副作用都只在应用边界触发，程序的可推理程度会大幅提升。


下面就是一个控制台程序的例子：

```scala
import cats.syntax.all._

object Console {
  def getStr(): IO[String] = IO.effect(() => scala.io.StdIn.readLine())
  def putStrLn(str: String): IO[Unit] = IO.effect(() => println(str))
}

def sum(i: IO[Int], j: IO[Int]): IO[Int] = {
    i.flatMap { ii =>
    j.map(jj => ii + jj)
  }
}

val readInt = Console.getStr().map(_.toInt)
val app = sum(readInt, readInt).flatMap { r =>
  Console.putStrLn(r.toString)
}
app.unsafeRun()
```

上述程序在 `IO` 类型没有定义 `flatMap` 、 `map` 的情况下，我们通过 `import cats.syntax.all._` 就可以使用 cats 通过 implicit class 定义的扩展函数。


这是 cats 约定的套路，扩展方法都定义在所谓 syntax 包中，当然我们也可以 for-comprehension 来使程序结构更清晰。


## 错误处理

虽然上述程序隔离了副作用（我们先忽略边界处的 `unsafeRun` ），但它仍旧不是一个纯函数，原因在于它数字转化：

```scala
val readInt = Console.getStr().map(_.toInt)
```

使用了`String.toInt`，这可能会在运行时抛出异常，所以这不是一个 total function，它对非整形的输入存在未定义行为（抛出异常），这种情况一般叫做 partial function。


严谨的程序显然不能接受运行到一半突然终止了，尤其是在一些服务端程序，这些程序通常需要一直运行提供服务，错误处理就显得格外重要。按照 Java 的习惯，我们只要在合适的地方加上 `try` `catch` 打印一行日志或显示系统错误 “假装” 已经处理了这些异常。


但这在一些要求知道错误信息的地方，就行不通了，Java 程序员可能会通过创建 ChecedException 来携带错误信息，实现错误处理逻辑。


scala 程序通常会使用 `Try` 或者 `Either` 来表达一个结果可能存在失败，上述程序我们可以用 `Either` 把 `readInt` 改成以下形式：
```scala
 val readInt: IO[Either[String, Int]] = Console.getStr().map { str =>
 try{
    Right(str.toInt)
  } catch {
    case e: Exception => Left(s"$str is not a number")
  }
}
```

这样，我们就成功地把错误信息保留在了 `Either` 中。然而，`sum` 函数的输入参数也得改成 `IO[Either[String, Int]]` 才行。这会导致 `sum` 的逻辑非常臃肿，这个函数它不需要关心具体错误信息，`Either` 的各种判断，会让逻辑变得不好理解。


为了解决这个问题 cats 还有 `MonadError` 的 Typeclass 来处理这类问题。我们只需要提供 `IO` 类型的 `MonadError` 实例，就可以使用相关操作。为了到达这个目的，我们将在 IO 中增加一种能携带错误子类型：

```scala
case class Failure[A](ex: Throwable) extends IO[A]
...
def unsafeRun(): A = this match {
  case IO.Pure(a) => a
  case IO.FlatMap(fa, f) => f(fa.unsafeRun).unsafeRun
  case IO.Effect(run) => run()
  case IO.Failure(ex) => throw ex
}

implicit def ioMonadErrorInstance: MonadError[IO, Throwable] = new MonadError[IO, Throwable] with StackSafeMonad[IO] {
  def pure[A](x: A) = IO.Pure(x)
  def flatMap[A, B](fa: IO[A])(f: A => IO[B]): IO[B] = IO.FlatMap(fa, f)
  def raiseError[A](e: Throwable) = IO.Failure(e)
  def handleErrorWith[A](fa: IO[A])(f: Throwable => IO[A]): IO[A] = {
    fa match {
      case Failure(ex) => f(ex)
      case io => io
    }
  }
}
```

> 注意 `unsafeRun` 本来就是不安全的，所以我们抛出异常并没有超出预期。

这样一来我们就可以把 `readInt` 重构成：

```scala
case class NotAInt(str: String) extends Throwable
val readInt: IO[Int] = Console.getStr().flatMap { str =>
  val r: Either[Throwable, Int] = try {
  Right(str.toInt)
} catch {
  case e: Throwable => Left(NotAInt(str))
}
  MonadError[IO, Throwable].fromEither(r) // 召唤 MonadError 实例
}
```

如果我们想处理这个错误，只需要在程序逻辑中增加相应逻辑：

```scala
val app = sum(readInt, readInt).flatMap { r =>
  Console.putStrLn(r.toString)
}.recoverWith {
  case NotAInt(str) => Console.putStrLn(s"$str 不是一个字符串")
}
```

当然，这个方案也不是没有缺点：

+ 首先，所有的错误都必须是 `Throwable` 的子类型。
+ 其次，所有的错误类型在程序中都泛化成了 `Throwable`，无法直观的从类型中看出错误类型，这样可能会导致调用者不知道需要处理什么错误。

所以在实际应用中，我们也可能会使用 `IO[Either[E, A]]` 以及相应的 transformer `EitherT` 来处理问题。这里我们只是演示一下 IO Monad 设计时，如果要携带错误信息，通常如何实现。

## 小结

本文简单介绍 IO Monad 的一个朴素设计，主要作为后续考察其他 IO Monad 如: Cats-Effect / ZIO 做一个铺垫。

同时本文也提出了编程中错误处理的重要性，以及如何用 MonadError 实现一种错误处理的手段,后续文章中，我们也会介绍其他错误处理的手段。
