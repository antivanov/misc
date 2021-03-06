package io.github.antivanov.learning.akka.project.stats.stream

import java.io.File

import akka.NotUsed
import akka.actor.ActorSystem
import akka.stream.{ActorAttributes, Materializer, Supervision}
import akka.stream.scaladsl.{Sink, Source}
import com.typesafe.scalalogging.Logger
import io.github.antivanov.learning.akka.project.stats.stream.util.FilesSource
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileLineCounter, LineCounts, ProjectStatsArgs}
import io.github.antivanov.learning.akka.project.stats.util.FileLineCounter.defaultFileLineCounter
import org.slf4j.LoggerFactory

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success, Try}
import scala.util.control.NonFatal

object ProjectStatsStreamApp extends App with ProjectStatsArgs {

  val logger = Logger(LoggerFactory.getLogger(ProjectStatsStreamApp.getClass))

  val streamDecider: Supervision.Decider = {
    case NonFatal(e) =>
      logger.error("Error in the stream", e)
      Supervision.Resume
    case _ =>
      Supervision.Stop
  }

  case class FileStats(extension: FileExtension, linesCount: Long) {
    def add(other: FileStats) =
      FileStats(extension, linesCount + other.linesCount)
  }

  implicit val system: ActorSystem = ActorSystem("compute-project-stats")
  implicit val ec: ExecutionContext = system.dispatcher

  val source = FilesSource.fromDirectory(new File(getProjectDirectory))

  class ProjectStatsComputer(fileLineCounter: FileLineCounter = defaultFileLineCounter) {

    val MaxExtensions = Integer.MAX_VALUE

    def fileToFileStats(file: File): FileStats = {
      val filePath = file.getPath
      val extension = filePath.substring(filePath.lastIndexOf('.') + 1)
      val lineCount = Try(
        fileLineCounter.countLines(file)
      ).toOption

      FileStats(FileExtension(extension), lineCount.getOrElse(0))
    }

    def computeLineCounts(source: Source[File, NotUsed])(implicit materializer: Materializer): Future[Map[FileExtension, Long]] =
      source
        .map(fileToFileStats)
        .groupBy(MaxExtensions, _.extension)
        .reduce(_.add(_))
        .mergeSubstreams
        .withAttributes(ActorAttributes.supervisionStrategy(streamDecider))
        .runWith(
          Sink.fold(Map[FileExtension, Long]())((map, fileStats) =>
            map + (fileStats.extension -> fileStats.linesCount)))
  }

  val statsComputer = new ProjectStatsComputer()

  statsComputer
    .computeLineCounts(source)
    .map(LineCounts(_).report)
    .andThen({
    case Success(lineCounts) =>
      println("Final line counts:")
      println(lineCounts)
      system.terminate()
    case Failure(e) =>
      e.printStackTrace()
  })
}
