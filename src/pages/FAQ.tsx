import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
      question: 'Important note: Verification is not an endorsement. Verified tags may also be removed later.',
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

const AccordionItem = ({ question, answer, isOpen, onClick }: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) => (
  <div className="border-b border-[#1C2838]">
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-5 text-left"
    >
      <span className="text-base font-semibold text-white pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="pb-5">
        <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{answer}</p>
      </div>
    )}
  </div>
)

export const FAQ = () => {
  const [activeTab, setActiveTab] = useState('Token Verification')
  const [openItems, setOpenItems] = useState<number[]>([0])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const tabs = Object.keys(faqData)

  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* Hero */}
      <div className="pt-16 pb-6 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">FAQ</h1>
        
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setOpenItems([0])
              }}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-[#1C2838] text-white border border-[#2A3A4A]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden">
          {(faqData[activeTab as keyof typeof faqData] || []).map((item, index) => (
            <AccordionItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openItems.includes(index)}
              onClick={() => toggleItem(index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-white font-semibold mb-4">Have a question that's not addressed?</p>
          <button className="bg-[#B7F34A] hover:bg-[#a3e635] text-black font-semibold px-6 py-3 rounded-full text-sm transition-colors">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  )
}