const lastWord = (text: string) => text.match(/\w+$/)?.[0] ?? ""

const AutoComplete = ({words}: {readonly words: readonly string[]}) => {
  const maxTotalCandidates = 10

  const getCandidates = (prefix: string) => {
    const result: string[] = []
    for (let word of words) {
      if (word.startsWith(prefix.toLowerCase())) result.push(word)
      if (result.length >= maxTotalCandidates) break
    }
    return result
  }

  const prefix = van.state("")
  const candidates = van.state(getCandidates(""))
  van.effect(() => candidates.val = getCandidates(prefix.val))
  const selectedIndex = van.state(0)
  van.effect(() => (candidates.val, selectedIndex.val = 0))

  const SuggestionListItem = ({index}: {index: number}) => pre(
    {class: () => index === selectedIndex.val ? "text-row selected" : "text-row"},
    () => candidates.val[index] ?? "",
  )

  const indices: number[] = []
  for (let i = 0; i < 10; ++i) indices.push(i)
  const suggestionList = div({class: "suggestion"},
    indices.map(index => SuggestionListItem({index})))

  const onkeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      selectedIndex.val = selectedIndex.val + 1 < candidates.val.length ? selectedIndex.val + 1 : 0
      e.preventDefault()
    } else if (e.key === "ArrowUp") {
      selectedIndex.val = selectedIndex.val > 0 ? selectedIndex.val - 1 : candidates.val.length - 1
      e.preventDefault()
    } else if (e.key === "Enter") {
      const candidate = candidates.val[selectedIndex.val] ?? prefix.val
      const target = <HTMLTextAreaElement>e.target
      target.value += candidate.substring(prefix.val.length)
      target.setSelectionRange(target.value.length, target.value.length)
      prefix.val = lastWord(target.value)
      e.preventDefault()
    }
  }

  const oninput = (e: Event) => prefix.val = lastWord((<HTMLTextAreaElement>e.target).value)

  return div({class: "root"}, textarea({onkeydown, oninput}), suggestionList)
}
