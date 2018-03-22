const data = require('../data/words')
const natural = require('natural')
const NGrams = natural.NGrams
const cld = require('cld')

const unique = (obj, keys) => {
  var uniques = []
  var stringify = {}
  for (var i = 0; i < obj.length; i++) {
    keys = keys.sort((a, b) => a - b)
    var str = ''
    for (var j = 0; j < keys.length; j++) {
      str += JSON.stringify(keys[j]).toLowerCase()
      str += JSON.stringify(obj[i][keys[j]]).toLowerCase()
    }
    if (!stringify.hasOwnProperty(str)) {
      uniques.push(obj[i])
      stringify[str] = true
    }
  }

  return uniques
}

const compare = (a, b) => {
  if (a.group.length > b.group.length) return -1
  if (a.group.length < b.group.length) return 1
  return 0
}

const removeRedundancy = groupedPhrases => {
  for (var i = 0; i < groupedPhrases.length; i++) {
    for (var j = 0; j < groupedPhrases.length; j++) {
      if (groupedPhrases[i] &&
          groupedPhrases[i].term.indexOf(groupedPhrases[j].term) !== -1 &&
          groupedPhrases[i].term !== groupedPhrases[j].term &&
          groupedPhrases[i].total === groupedPhrases[j].total) {
        groupedPhrases[j].total = 0
      }
    }
  }

  let filteredPhrases = groupedPhrases.filter(gs => gs.total > 0)

  return filteredPhrases
}

const getAllRelateds = (groupName, groups) => groups.filter(g => g.indexOf(groupName) !== -1 && g !== groupName)

const getRelateds = groupedPhrases => {
  var groups = groupedPhrases.map(group => group.term)

  groupedPhrases = groupedPhrases.map(group => {
    var term = group.term
    var relateds = getAllRelateds(term, groups)
    group.relateds = relateds

    return group
  })

  return groupedPhrases
}

const ngrams = (term, lang) => {
  const commondWords = data.commondWords[lang] || data.allCommondWords
  const blacklist = data.stopwords[lang] || data.allstopwords
  const groups = []

  // max size of the ngrams (4).
  const size = term.split(' ').length > 4 ? 4 : term.split(' ').length

  if (size === 1) {
    groups.push(term)
    return groups
  }

  for (var i = 1; i <= size; i++) {
    var ngrams = NGrams.ngrams(term, i)

    for (var j = 0; j < ngrams.length; j++) {
      // filter stopwords only when is just one word to reduce the querys
      if (ngrams[j].length === 1) {
        ngrams[j].forEach(word => {
          if (commondWords.indexOf(word) === -1 && blacklist.indexOf(word) === -1) {
            groups.push(ngrams[j].join(' '))
          }
        })
      } else {
        groups.push(ngrams[j].join(' '))
      }
    };
  }

  return groups
}

const smartGrouping = (phrases, groups, lang) => {
  let auxPhrase
  let groupedPhrases = {}
  let splittedPhrase
  let stemmed
  let groupsObject = {}

  groups.forEach(group => {
    // Construct the groups object
    groupsObject[group.stemmed] = group.group

    // construct the checker with stemming
    stemmed = group.stemmed
    if (!groupedPhrases[stemmed]) groupedPhrases[stemmed] = []
  })

  phrases.forEach(Phrase => {
    // Group by stemming
    auxPhrase = stemming([Phrase], lang)
    auxPhrase = auxPhrase[0].stemmed
    splittedPhrase = ngrams(auxPhrase, lang)

    splittedPhrase.forEach(word => {
      if (groupedPhrases[word]) groupedPhrases[word].push(Phrase)
    })
  })

  let result = Object.keys(groupedPhrases).map(gr => {
    let group = {
      term: groupsObject[gr],
      group: groupedPhrases[gr],
      relateds: [],
      total: groupedPhrases[gr].length
    }
    return group
  })

  return result
}

const stemming = (phrases, lang) => {
  var groups = []
  var stemmed
  var group
  var splittedPhrase

  phrases.forEach(phrase => {
    splittedPhrase = phrase.split(' ')
    stemmed = splittedPhrase.map(word => {
      if (lang === 'spanish' || lang === 'es') return natural.PorterStemmerEs.stem(word)
      if (lang === 'english' || lang === 'en') return natural.PorterStemmer.stem(word)

      return word
    })

    stemmed = stemmed.join(' ')
    group = {group: phrase, stemmed}
    groups.push(group)
  })

  return groups
}

const extractGroups = (phrases, lang) => {
  const blacklist = data.stopwords[lang] || data.allstopwords
  var counts = {}

  phrases.forEach(phrase => {
    var splitedTerm = ngrams(phrase, lang)
    splitedTerm.forEach(word => {
      var valid = true
      word.split(' ').forEach(w => {
        if (blacklist.indexOf(w) !== -1 || w.length <= 1) {
          valid = false
        }
      })
      if (valid) {
        counts[word] = (counts[word] || 0) + 1
      }
    })
  })

  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a])

  let groups = stemming(sorted, lang)
  groups = unique(groups, ['stemmed'])

  return groups
}

const splitMethod = payload => {
  var phrases
  var comas = payload.split(',').length
  var returns = payload.split('\n').length

  if (returns > comas) {
    phrases = payload.split('\n')
  } else {
    phrases = payload.split(',')
  }

  return phrases
}

const cleanPhrases = phraseArray => phraseArray.map(phrase => phrase.trim())

const grouper = (body, minGroupSize, lang) => {
  const detectedLanguage = cld.detect(body, (error, result) => {
    if (error) throw error
    if (result) return result.languages[0].name.toLowerCase()
    return result
  })

  lang = lang || detectedLanguage

  let phrases = splitMethod(body)
  phrases = cleanPhrases(phrases)

  const groups = extractGroups(phrases, lang)

  let groupedPhrases = smartGrouping(phrases, groups, lang)
  groupedPhrases = groupedPhrases.filter(o => o.group.length >= minGroupSize)
  groupedPhrases = removeRedundancy(groupedPhrases)
  groupedPhrases = groupedPhrases.sort(compare)
  groupedPhrases = getRelateds(groupedPhrases)

  const result = {
    groups: groupedPhrases,
    totalGroups: groupedPhrases.length,
    totalKeywords: phrases.length
  }

  return result
}

module.exports = grouper
