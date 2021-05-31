package ch6

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class TrieSpec extends AnyFreeSpec with Matchers {

  val presentKeys = List("abcd", "abe", "ab", "ac", "ad", "eab", "efg")
  val absentKeys = List("fgh", "ah", "ea")

  assert(absentKeys.toSet.intersect(presentKeys.toSet).isEmpty)

  val trie = Trie.withKeys(presentKeys)

  "addKey" - {

    "should contain added keys" in {
      presentKeys.foreach(key =>
        trie.contains(key) shouldBe true
      )
    }

    "should not contain absent keys" in {
      absentKeys.foreach(key =>
        trie.contains(key) shouldBe false
      )
    }
  }

  "keysHavingPrefix" - {
    "should return set of keys which match prefix" in {
      val prefix = "ab"
      val expectedKeysHavingPrefix = presentKeys.filter(_.startsWith(prefix)).toSet
      trie.keysHavingPrefix(prefix) shouldEqual expectedKeysHavingPrefix
    }
  }

  "keysMatchingStringPrefix" - {
    "should return keys which are prefix of the string" in {
      val string = "abcdef"
      val expectedKeyPrefixes = presentKeys.filter(string.startsWith(_)).toSet
      trie.keyPrefixesOf(string) shouldEqual expectedKeyPrefixes
    }
  }

  "delete"- {
    "should delete the keys from the trie" in {
      val deletedKeys = presentKeys.zipWithIndex.flatMap({ case (key, idx) =>
        if (idx % 2 == 0)
           Some(key)
        else
           None}) ++ absentKeys
      val remainingKeys = presentKeys.filter(!deletedKeys.contains(_))

      val trieAfterKeyDeletion = deletedKeys.foldLeft(trie)({ case (trie, key) =>
        trie.delete(key)
      })

      deletedKeys.foreach(key =>
        trieAfterKeyDeletion.contains(key) shouldBe false
      )
      remainingKeys.foreach(key =>
        trieAfterKeyDeletion.contains(key) shouldBe true
      )
    }
  }
}
