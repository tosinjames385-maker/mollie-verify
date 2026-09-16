import { ExternalLink, Code, Shield, Zap, Database } from 'lucide-react'

const CodeBlock = ({ title, method, endpoint, description, curl, response }: {
  title: string
  method?: string
  endpoint?: string
  description: string
  curl: string
  response: string
}) => (
  <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden">
    <div className="p-5">
      <div className="flex items-center gap-2 mb-2">
        {method && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {method}
          </span>
        )}
        {endpoint && (
          <span className="text-xs text-gray-400 font-mono">{endpoint}</span>
        )}
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
    
    <div className="bg-[#060C14] border-t border-[#1C2838] p-4">
      <pre className="text-xs font-mono overflow-x-auto">
        <code>
          <span className="text-gray-500"># Search by symbol, name, or mint</span>{'\n'}
          <span className="text-[#B7F34A]">$</span>{' '}
          <span className="text-white">{curl}</span>{'\n'}
          {'\n'}
          <span className="text-gray-500"># Response</span>{'\n'}
          <span className="text-gray-300">{response}</span>
        </code>
      </pre>
    </div>
  </div>
)

const EndpointCard = ({ method, path, description, details }: {
  method: string
  path: string
  description: string
  details: string
}) => (
  <div className="bg-[#060C14] border border-[#1C2838] rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
      }`}>
        {method}
      </span>
      <span className="text-xs text-gray-400 font-mono">{path}</span>
      <span className="text-xs text-gray-500 ml-auto">{details}</span>
    </div>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
)

export const APIs = () => {
  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* Hero */}
      <div className="pt-16 pb-10 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Build on{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2B8] to-[#B7F34A]">
            VRFD
          </span>{' '}
          token data.
        </h1>
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
          The APIs trusted across wallets, dexes, and apps. Also available in agent skills and CLI.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-6">
        {/* Token Data */}
        <CodeBlock
          title="Token Data"
          method="GET"
          endpoint="/tokens/v2/search"
          description="Search tokens, get metadata, verification status, and trading stats for any Solana token."
          curl='curl https://api.jup.ag/tokens/v2/search?query=SOL \
    -H "x-api-key: $API_KEY"'
          response='[{ "id": "So1111...1112", "symbol": "SOL", "isVerified": true, "usdPrice": 145.47, ... }]'
        />

        {/* Express Verification */}
        <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#B7F34A]" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Express Verification</h3>
            <p className="text-sm text-gray-400">Two-step flow: craft a transaction, sign it, and submit. Fully programmatic.</p>
          </div>
          
          <div className="p-4 space-y-3">
            <EndpointCard
              method="GET"
              path="/tokens/v2/verify/express/craft-txn"
              description="Build the verification transaction"
              details="Craft Transaction"
            />
            <EndpointCard
              method="POST"
              path="/tokens/v2/verify/express/execute"
              description="Submit the signed transaction"
              details="Execute"
            />
          </div>

          <div className="bg-[#060C14] border-t border-[#1C2838] p-4">
            <pre className="text-xs font-mono overflow-x-auto">
              <code>
                <span className="text-gray-500"># Craft the verification transaction</span>{'\n'}
                <span className="text-[#B7F34A]">$</span>{' '}
                <span className="text-white">curl https://api.jup.ag/tokens/v2/verify/express/craft-txn \
    -H "x-api-key: $API_KEY"</span>{'\n'}
                {'\n'}
                <span className="text-gray-500"># Response</span>{'\n'}
                <span className="text-gray-300">{'{ "transaction": "AQABAv...", "requestId": "req_8f3a...", "feeUsdAmount": 12.40, ... }'}</span>
              </code>
            </pre>
          </div>
        </div>

        {/* View API Docs */}
        <a
          href="#"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          View API docs
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}