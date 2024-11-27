import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  model: string;
  prefix: string;
  prompt: string;
  response: string;
  description: string;
}

async function getTestResults() {
  const filePath = path.join(process.cwd(), 'public', 'test-results.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as TestResult[];
  } catch (error) {
    console.error('Error reading test results:', error);
    return [];
  }
}

export default async function Home() {
  const results = await getTestResults();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">LLM Prefix Prompting Results</h1>
        
        <div className="mb-8">
          <p className="text-lg">
            This page demonstrates how different language models respond to the same prompts
            with various prefixes that set different personas or tones.
          </p>
        </div>

        {results.length === 0 ? (
          <p className="text-gray-600">No test results available yet. Run the test script to generate results.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prefix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.prefix}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.prompt}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
