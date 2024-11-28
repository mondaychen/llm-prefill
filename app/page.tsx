import { promises as fs } from 'fs';
import path from 'path';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';

interface TestResult {
  model: string;
  prefix: string;
  prompt: string;
  response: string;
  description: string;
  hasError: boolean;
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
          <DataTable columns={columns} data={results} />
        )}
      </div>
    </main>
  );
}
