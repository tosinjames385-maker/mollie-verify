import { useState } from 'react'
import { ChevronDown, ChevronUp, Search, MessageCircle, HelpCircle } from 'lucide-react'

const faqData = {
  'Token Verification': [
    {
      question: 'Why verify?',
      answer: 'In the permissionless world, anyone can mint a token and name it whatever they want. Verification adds a green checkmark next to your token to indicate that it is the canonical one, so that traders can find the right token easily. Additionally, the verified token list is integrated by many partners in the ecosystem from dexes to wallets to screeners, and it helps with discoverability and credibility of your token.',
    },
    {
      question: 'What is the verification criteria? Why is my token rejected?',
      answer: 'Tokens must meet certain criteria to be verified including having a valid website, social media presence, and meeting minimum trading volume requirements. Tokens that fail to meet these criteria or have suspicious activity may be rejected.',
    },
    {
      question: 'Important note: Verification is not an endorsement.',
      answer: 'Verification is simply a way to confirm that a token is the canonical version with that name and symbol. It does not mean Jupiter endorses the token or its project. Verified status can be revoked if the token no longer meets criteria or engages in suspicious activity.',
    },
    {
      question: 'Tell me about the history of Jupiter Verify.',
      answer: 'Jupiter Verify started as a community-driven initiative to help traders identify legitimate tokens on Solana. Over time, it has evolved into a comprehensive verification system trusted by wallets, DEXes, and other ecosystem participants.',
    },
    {
      question: 'What is the difference between the standard lane and express lane?',
      answer: 'The standard lane is the free, community-driven verification process. The express lane is a paid option that provides faster verification through an automated process, typically within minutes.',
    },
    {
      question: 'Why is my token not verified? I put it through on the express lane.',
      answer: 'Express lane verification may fail if your token does not meet the automated criteria checks. This could be due to insufficient trading volume, missing metadata, or other quality signals that the system requires.',
    },
    {
      question: 'What should I do if my token is not verified?',
      answer: 'Review the verification criteria, ensure your token has complete metadata and sufficient trading activity, then resubmit. You can also reach out to the team for guidance on improving your token\'s chances of verification.',
    },
  ],
  'Metadata Updates': [
    {
      question: 'How do I update my token metadata?',
      answer: 'You can submit a metadata update request through the Submissions page. This will be reviewed by the team before being applied to your token.',
    },
    {
      question: 'What metadata can be updated?',
      answer: 'You can update your token\'s name, symbol, description, website, social links, and logo image through the metadata update process.',
    },
    {
      question: 'How long do metadata updates take?',
      answer: 'Standard metadata updates are typically reviewed within 24-48 hours. Express updates are processed within minutes for a small fee.',
    },
  ],
}

export const FAQ = () => {
  const [activeTab, setActiveTab] = useState('Token Verification')
  const [openItems, setOpenItems] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const tabs = Object.keys(faqData)

  const currentFaqs = (faqData[activeTab as keyof typeof faqData] || []).filter(item => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-[#06090E]">
      {/* Hero */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0B1118] border border-[#16212D] rounded-full mb-5">
            <HelpCircle className="w-3.5 h-3.5 text-[#c7f284]" />
            <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">Help Center</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            Everything you need to know about token verification, metadata updates, and the Jupiter ecosystem.
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setOpenItems([])
                setSearchQuery('')
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-[#c7f284] text-black'
                  : 'bg-[#0B1118] text-gray-400 hover:text-white border border-[#16212D] hover:border-[#1F2E3E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1118] border border-[#16212D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c7f284]/40 transition-colors"
          />
        </div>
      </div>

      {/* FAQ List */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="space-y-2">
          {currentFaqs.length > 0 ? (
            currentFaqs.map((item, index) => {
              const isOpen = openItems.includes(index)
              return (
                <div
                  key={index}
                  className={`bg-[#0B1118] border rounded-xl transition-all ${
                    isOpen ? 'border-[#c7f284]/30 shadow-lg shadow-[#c7f284]/5' : 'border-[#16212D] hover:border-[#1F2E3E]'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOpen ? 'bg-[#c7f284]/15 text-[#c7f284]' : 'bg-[#141E2A] text-gray-500'
                      }`}>
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${
                        isOpen ? 'text-white' : 'text-gray-300'
                      }`}>
                        {item.question}
                      </span>
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isOpen ? 'bg-[#c7f284]/15 rotate-180' : 'bg-[#141E2A]'
                    }`}>
                      <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-[#c7f284]' : 'text-gray-500'}`} />
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-4 pb-4 pl-14">
                      <p className="text-xs text-gray-400 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-[#0B1118] border border-[#16212D] rounded-xl p-12 text-center">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No questions match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#c7f284] hover:underline mt-2"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-[#0B1118] border border-[#16212D] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#c7f284]/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-5 h-5 text-[#c7f284]" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
            Can't find what you're looking for? Our team is ready to help you with any questions.
          </p>
          <button className="bg-[#c7f284] hover:bg-[#b8e377] text-black font-semibold px-6 py-2.5 rounded-lg text-xs transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}
