import { StateGraph, END, START, MemorySaver, Annotation } from '@langchain/langgraph';
import { RouterAgent } from './RouterAgent.js';
import { RagAgent } from './RagAgent.js';
import { InvoiceAgent, InvoiceData } from './InvoiceAgent.js';
import { MediaAgent, MediaCard } from './MediaAgent.js';
import { SupportAgent, SupportTicketData } from './SupportAgent.js';
import { CatalogItem } from '../types.js';

// Define the State for the Agent Graph
export const GraphState = Annotation.Root({
  conversationId: Annotation<string>(),
  inputMessage: Annotation<string>(),
  customerName: Annotation<string>({
    reducer: (curr, update) => update || curr,
    default: () => 'العميل'
  }),
  history: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => []
  }),
  catalog: Annotation<CatalogItem[]>({
    reducer: (curr, update) => update,
    default: () => []
  }),
  intent: Annotation<string>(),
  confidence: Annotation<number>(),
  suggestedAgent: Annotation<string>(),
  finalResponse: Annotation<string>(),
  metadata: Annotation<any>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({})
  })
});

const routerAgent = new RouterAgent();
const ragAgent = new RagAgent();
const invoiceAgent = new InvoiceAgent();
const mediaAgent = new MediaAgent();
const supportAgent = new SupportAgent();
const memory = new MemorySaver();

// NODE: Router
async function routeNode(state: typeof GraphState.State) {
  const result = await routerAgent.classifyIntent(state.inputMessage);
  return {
    intent: result.intent,
    confidence: result.confidence,
    suggestedAgent: result.suggestedAgent
  };
}

// NODE: Sales/RAG
async function salesNode(state: typeof GraphState.State) {
  const historyText = state.history.slice(-10).join('\n');
  const response = await ragAgent.queryCatalog(state.inputMessage, state.catalog, historyText);
  return {
    finalResponse: response,
    history: [`User: ${state.inputMessage}`, `SalesAgent: ${response}`]
  };
}

// NODE: Invoice Agent
async function invoiceNode(state: typeof GraphState.State) {
  const result = await invoiceAgent.generateInvoice(state.inputMessage, state.customerName || 'العميل المميز');
  return {
    finalResponse: result.textResponse,
    metadata: { invoice: result.invoice },
    history: [`User: ${state.inputMessage}`, `InvoiceAgent: ${result.textResponse}`]
  };
}

// NODE: Media Agent
async function mediaNode(state: typeof GraphState.State) {
  const result = await mediaAgent.generateMediaCard(state.inputMessage);
  return {
    finalResponse: result.textResponse,
    metadata: { mediaCard: result.card },
    history: [`User: ${state.inputMessage}`, `MediaAgent: ${result.textResponse}`]
  };
}

// NODE: Support Agent
async function supportNode(state: typeof GraphState.State) {
  const result = await supportAgent.handleSupportQuery(state.inputMessage);
  return {
    finalResponse: result.textResponse,
    metadata: { ticket: result.ticket },
    history: [`User: ${state.inputMessage}`, `SupportAgent: ${result.textResponse}`]
  };
}

// NODE: FAQ/General
async function faqNode(state: typeof GraphState.State) {
  const historyText = state.history.slice(-10).join('\n');
  const response = await ragAgent.queryCatalog(state.inputMessage, [], historyText);
  return {
    finalResponse: response,
    history: [`User: ${state.inputMessage}`, `AI: ${response}`]
  };
}

// NODE: Human Handoff
async function humanNode(state: typeof GraphState.State) {
  const response = 'تم تحويل محادثتك لأحد ممثلي خدمة العملاء. يرجى الانتظار، سيتم الرد عليك في أقرب وقت ممكن.';
  return {
    finalResponse: response,
    history: [`User: ${state.inputMessage}`, `System: ${response}`]
  };
}

// Build the Graph
const workflow = new StateGraph(GraphState)
  .addNode('router', routeNode)
  .addNode('sales', salesNode)
  .addNode('invoice', invoiceNode)
  .addNode('media', mediaNode)
  .addNode('support', supportNode)
  .addNode('faq', faqNode)
  .addNode('human', humanNode)
  .addEdge(START, 'router')
  .addConditionalEdges('router', (state) => {
    if (state.suggestedAgent === 'human') return 'human';
    if (state.suggestedAgent === 'invoice') return 'invoice';
    if (state.suggestedAgent === 'media') return 'media';
    if (state.suggestedAgent === 'support') return 'support';
    if (state.suggestedAgent === 'rag') return 'sales';
    return 'faq';
  }, {
    human: 'human',
    invoice: 'invoice',
    media: 'media',
    support: 'support',
    sales: 'sales',
    faq: 'faq'
  })
  .addEdge('sales', END)
  .addEdge('invoice', END)
  .addEdge('media', END)
  .addEdge('support', END)
  .addEdge('faq', END)
  .addEdge('human', END);

// Compile Graph with Checkpointing
export const appGraph = workflow.compile({ checkpointer: memory });
