import { ScenarioCard } from '../models/types';

export const DECISION_CARDS: ScenarioCard[] = [
  {
    id: 'decision_l1_familiarity', category: 'decision', title: 'Build the Core',
    scenario: 'You are investing $240 that will not be needed for at least eight years.',
    objective: 'Build a durable core while avoiding a single-company failure becoming a major setback.',
    evidence: ['Nova Tech is familiar and exciting, but one company.', 'The Balanced Index Fund owns many companies.', 'Your emergency reserve is already adequate.'],
    concept: 'Familiarity bias and diversification', minLevel: 1, maxLevel: 1,
    tip: 'Familiar investments can feel safer than they actually are.',
    choices: [
      { id: 'diversified_core', label: 'Buy 3 index-fund shares', description: 'Put the full $240 into a diversified core.', effect: { cash: -240, shares: { CONS: 3 }, downsideShieldUses: 1 }, outcome: 'optimal', impact: '3 fund shares plus 1 downside shield', explanation: 'This directly matches the stated objective: long horizon, adequate liquidity and limited company-specific risk.' },
      { id: 'split_core', label: 'Split between fund and Health', description: 'Buy 2 fund shares and 1 Health share for $280.', effect: { cash: -280, shares: { CONS: 2, HEAL: 1 } }, outcome: 'reasonable', impact: 'A diversified but slightly more concentrated $280 allocation', explanation: 'This remains diversified, although the extra single-company position adds risk without being required by the objective.' },
      { id: 'familiar_company', label: 'Buy only Nova Tech', description: 'Pay $240 for 2 shares at a premium.', effect: { cash: -240, shares: { TECH: 2 } }, outcome: 'costly', bias: 'Familiarity bias', impact: 'Concentrated exposure and $40 of implied overpayment', explanation: 'Knowing a company name does not reduce its business or valuation risk. The choice contradicts the goal of limiting single-company damage.' }
    ]
  },
  {
    id: 'decision_l1_loss_aversion', category: 'decision', title: 'A Normal Market Decline',
    scenario: 'Your diversified fund falls 12% during a broad correction. Its holdings and your eight-year horizon are unchanged.',
    objective: 'Protect the long-term plan without taking more risk than originally intended.',
    evidence: ['The decline affects the broad market.', 'The investment thesis is unchanged.', 'You still have sufficient emergency cash.'],
    concept: 'Loss aversion and disciplined investing', minLevel: 1, maxLevel: 1,
    tip: 'Loss aversion can make a temporary decline feel more dangerous than an unplanned reaction.',
    choices: [
      { id: 'continue_plan', label: 'Continue the planned contribution', description: 'Buy 2 fund shares for $160 and gain a shield.', effect: { cash: -160, shares: { CONS: 2 }, downsideShieldUses: 1 }, outcome: 'optimal', impact: '2 fund shares plus 1 downside shield', explanation: 'The facts and horizon are unchanged, so continuing the established allocation is the most consistent response.' },
      { id: 'hold_review', label: 'Hold and review next round', description: 'Make no trade and keep all cash available.', effect: {}, outcome: 'reasonable', impact: 'No gain or loss; capital remains uninvested', explanation: 'Pausing is defensible, but it gives up the chance to invest at lower prices despite unchanged evidence.' },
      { id: 'panic_exit', label: 'Exit immediately to stop the fear', description: 'Lose $90 to poor timing and transaction costs.', effect: { cash: -90 }, outcome: 'costly', bias: 'Loss aversion', impact: '−$90 cash', explanation: 'Selling solely because prices fell converts discomfort into a permanent cost even though the stated thesis did not change.' }
    ]
  },
  {
    id: 'decision_l1_herding', category: 'decision', title: 'The Viral Stock Tip',
    scenario: 'Thousands of posts predict a quick doubling in Nova Tech after three strong weeks.',
    objective: 'Use reliable evidence and avoid paying for popularity alone.',
    evidence: ['No new earnings information has been published.', 'The stock already rose 35%.', 'Most posts repeat the same anonymous source.'],
    concept: 'Herding and social proof', minLevel: 1, maxLevel: 1,
    socialMediaScenario: true, socialSource: 'Trending investment feed',
    tip: 'A crowd can spread information—or simply repeat the same unsupported claim.',
    choices: [
      { id: 'verify_independently', label: 'Verify independent evidence', description: 'Wait and earn 15% off a researched trade.', effect: { tradeDiscountPercent: 0.15, tradeDiscountUses: 1 }, outcome: 'optimal', impact: '15% discount on the next investment', explanation: 'The evidence is duplicated rather than independent, so verification is more valuable than acting quickly.', socialInfluence: { verification: 18, hypePull: -12, independentJudgment: 10, insight: 'You slowed down a viral claim and looked for evidence outside the repeated source.' } },
      { id: 'small_speculation', label: 'Limit it to a small position', description: 'Buy 1 Tech share for $110.', effect: { cash: -110, shares: { TECH: 1 } }, outcome: 'reasonable', impact: '1 Tech share with position size controlled', explanation: 'The information quality is weak, but strict position sizing contains the damage if the story fails.', socialInfluence: { verification: 4, hypePull: 1, independentJudgment: 5, insight: 'The trend influenced you, but position sizing kept the social pressure from controlling the portfolio.' } },
      { id: 'follow_crowd', label: 'Buy aggressively before others do', description: 'Pay $300 for 2 shares at the hype price.', effect: { cash: -300, shares: { TECH: 2 } }, outcome: 'costly', bias: 'Herding / social proof', impact: '2 concentrated shares purchased at a $100 hype premium', explanation: 'Popularity is being treated as proof even though the posts provide no new independent evidence.', socialInfluence: { verification: -12, hypePull: 18, independentJudgment: -10, insight: 'Follower counts and repetition overpowered the missing evidence in this decision.' } }
    ]
  },
  {
    id: 'decision_l1_sponsored_reel', category: 'decision', title: 'The Sponsored “10X” Reel',
    scenario: 'A popular creator calls Nova Tech a “guaranteed 10X.” The video has 900,000 likes, while #ad appears only in the collapsed caption.',
    objective: 'Separate the investment evidence from the creator’s incentives and popularity.',
    evidence: ['The creator was paid by a trading platform.', 'No valuation or downside case is provided.', 'The company’s latest public filing is available.'],
    concept: 'Finfluencer incentives and disclosure', minLevel: 1, maxLevel: 1,
    socialMediaScenario: true, socialSource: 'Sponsored short-form video',
    tip: 'A disclosure does not make a claim false, but it changes how independently the claim should be evaluated.',
    choices: [
      { id: 'check_disclosure_filings', label: 'Check the disclosure and public filing', description: 'Earn 20% off a researched investment.', effect: { tradeDiscountPercent: 0.20, tradeDiscountUses: 1 }, outcome: 'optimal', impact: '20% research discount', explanation: 'You evaluated both the source’s incentive and the underlying company information before acting.', socialInfluence: { verification: 20, hypePull: -12, independentJudgment: 10, insight: 'You treated sponsorship and popularity as context—not as investment evidence.' } },
      { id: 'watchlist_first', label: 'Add it to a watchlist with a strict limit', description: 'Gain one downside shield without buying yet.', effect: { downsideShieldUses: 1 }, outcome: 'reasonable', impact: '1 downside shield', explanation: 'You did not verify the thesis fully, but you prevented urgency from forcing an oversized position.', socialInfluence: { verification: 6, hypePull: -3, independentJudgment: 5, insight: 'You felt the creator’s urgency but created a boundary before committing money.' } },
      { id: 'trust_creator_followers', label: 'Buy because the creator has a huge following', description: 'Pay $330 for 2 Tech shares at the promoted price.', effect: { cash: -330, shares: { TECH: 2 } }, outcome: 'costly', bias: 'Authority and popularity cues', impact: '2 shares plus a $130 promotion premium', explanation: 'Audience size and confidence do not establish valuation, independence or accuracy.', socialInfluence: { verification: -14, hypePull: 20, independentJudgment: -10, insight: 'The creator’s reach and certainty became a substitute for checking the investment claim.' } }
    ]
  },
  {
    id: 'decision_l2_anchor', category: 'decision', title: 'Anchored to the Purchase Price',
    scenario: 'You bought Nova Tech at $140. It now trades at $90 after losing a major customer and cutting its forecast.',
    objective: 'Allocate new capital using today’s expected return—not the old purchase price.',
    evidence: ['The earnings outlook materially weakened.', '$140 is historical and does not determine future value.', 'A diversified alternative is available.'],
    concept: 'Anchoring', minLevel: 2, maxLevel: 2,
    tip: 'The market does not know or care what price you originally paid.',
    choices: [
      { id: 'reassess_today', label: 'Reassess from today’s facts', description: 'Direct $240 to 3 fund shares and gain a shield.', effect: { cash: -240, shares: { CONS: 3 }, downsideShieldUses: 1 }, outcome: 'optimal', impact: '3 diversified shares plus 1 downside shield', explanation: 'New money should go where the current evidence offers the best risk-adjusted outlook.' },
      { id: 'wait_for_update', label: 'Wait for the next earnings report', description: 'Keep cash and take no immediate action.', effect: {}, outcome: 'reasonable', impact: 'No immediate change', explanation: 'Waiting for clearer information is defensible, though the old purchase price should still play no role.' },
      { id: 'average_to_140', label: 'Buy more because it must return to $140', description: 'Spend $270 for 2 Tech shares.', effect: { cash: -270, shares: { TECH: 2 } }, outcome: 'costly', bias: 'Anchoring', impact: '2 Tech shares plus a $90 anchoring penalty', explanation: 'The old price is being mistaken for fair value even after the business outlook changed.' }
    ]
  },
  {
    id: 'decision_l2_recency', category: 'decision', title: 'Three Great Energy Rounds',
    scenario: 'Energy has led the market for three rounds. Forecasts now show wider possible outcomes, not higher certainty.',
    objective: 'Improve the portfolio without allowing recent performance to dictate the whole allocation.',
    evidence: ['Energy is already your most volatile available sector.', 'Three rounds are a short sample.', 'Your target allocation calls for multiple asset classes.'],
    concept: 'Recency bias', minLevel: 2, maxLevel: 2,
    tip: 'Recent returns are vivid, but a short streak is weak evidence about the next period.',
    choices: [
      { id: 'rebalance_new_money', label: 'Use new money to diversify', description: 'Buy 2 fund shares and prepare a bond discount.', effect: { cash: -160, shares: { CONS: 2 }, tradeDiscountPercent: 0.15, tradeDiscountUses: 1 }, outcome: 'optimal', impact: '2 fund shares plus 15% off the next investment', explanation: 'This respects the target allocation while avoiding a forecast based on a short winning streak.' },
      { id: 'measured_energy', label: 'Add one measured Energy share', description: 'Spend $100 while limiting position size.', effect: { cash: -100, shares: { ENER: 1 } }, outcome: 'reasonable', impact: '1 Energy share', explanation: 'A small tilt can be reasonable if it stays within the risk budget.' },
      { id: 'chase_winner', label: 'Concentrate in the recent winner', description: 'Spend $360 for 3 Energy shares.', effect: { cash: -360, shares: { ENER: 3 } }, outcome: 'costly', bias: 'Recency bias / performance chasing', impact: '3 volatile shares bought after the run-up', explanation: 'The choice assumes a short recent pattern will continue despite wider uncertainty and the diversification objective.' }
    ]
  },
  {
    id: 'decision_l2_confirmation', category: 'decision', title: 'The Uncomfortable Research Report',
    scenario: 'A credible report challenges your favorite stock using data you had not considered.',
    objective: 'Test the investment thesis before committing another $250.',
    evidence: ['The report cites audited filings.', 'Its author holds no position in the stock.', 'Your original thesis did not consider the identified debt risk.'],
    concept: 'Confirmation bias', minLevel: 2, maxLevel: 2,
    tip: 'Strong research actively looks for evidence that could prove the thesis wrong.',
    choices: [
      { id: 'test_both_sides', label: 'Model both the bull and bear case', description: 'Gain 2 downside shields.', effect: { downsideShieldUses: 2 }, outcome: 'optimal', impact: '2 downside shields', explanation: 'The source is credible and introduces relevant new evidence, so the thesis should be stress-tested.' },
      { id: 'reduce_order', label: 'Proceed with a smaller order', description: 'Buy 1 Tech share for $110.', effect: { cash: -110, shares: { TECH: 1 } }, outcome: 'reasonable', impact: '1 Tech share with exposure limited', explanation: 'Sizing down acknowledges uncertainty, although deeper analysis would be stronger.' },
      { id: 'dismiss_report', label: 'Dismiss it and follow supportive accounts', description: 'Lose $120 when the ignored risk surfaces.', effect: { cash: -120 }, outcome: 'costly', bias: 'Confirmation bias', impact: '−$120 cash', explanation: 'The choice rejects credible conflicting evidence and seeks only information that protects the preferred belief.' }
    ]
  },
  {
    id: 'decision_l2_algorithm_echo', category: 'decision', title: 'Your Feed Agrees With You',
    scenario: 'After watching several bullish Energy videos, your feed now shows almost nothing except creators predicting another surge.',
    objective: 'Decide whether repeated agreement represents independent evidence or an algorithmically narrowed information set.',
    evidence: ['The posts cite two original sources between them.', 'Bearish analysis receives little engagement in your feed.', 'Energy is already a large part of your portfolio.'],
    concept: 'Algorithmic reinforcement and source diversity', minLevel: 2, maxLevel: 2,
    socialMediaScenario: true, socialSource: 'Personalized recommendation feed',
    tip: 'A personalized feed can make one viewpoint look universal even when many posts trace back to the same evidence.',
    choices: [
      { id: 'seek_opposing_sources', label: 'Seek credible opposing and primary sources', description: 'Gain 2 downside shields.', effect: { downsideShieldUses: 2 }, outcome: 'optimal', impact: '2 downside shields', explanation: 'You deliberately widened the information set before increasing an already concentrated position.', socialInfluence: { verification: 18, hypePull: -10, independentJudgment: 12, insight: 'You recognized that feed repetition was not the same as independent confirmation.' } },
      { id: 'hold_current_energy', label: 'Keep the position but do not add more', description: 'Maintain exposure without increasing concentration.', effect: {}, outcome: 'reasonable', impact: 'No immediate portfolio change', explanation: 'This controls concentration, although the supporting evidence still needs broader verification.', socialInfluence: { verification: 5, hypePull: -2, independentJudgment: 6, insight: 'You resisted adding risk, but did not fully test the information bubble.' } },
      { id: 'feed_consensus_buy', label: 'Buy because every post agrees', description: 'Spend $400 for 3 Energy shares at a feed-driven premium.', effect: { cash: -400, shares: { ENER: 3 } }, outcome: 'costly', bias: 'Algorithmic echo chamber', impact: '3 concentrated Energy shares bought after the run-up', explanation: 'Apparent consensus came from personalization and repeated sources, not broader independent evidence.', socialInfluence: { verification: -16, hypePull: 20, independentJudgment: -12, insight: 'The algorithm’s repetition made a narrow viewpoint feel like market-wide agreement.' } }
    ]
  },
  {
    id: 'decision_l3_sunk_cost', category: 'decision', title: 'The Underperforming Property',
    scenario: 'A property needs another $400 repair. Updated rent estimates no longer justify the total future cost.',
    objective: 'Choose based on future cash flows rather than money already spent.',
    evidence: ['Past renovation spending cannot be recovered.', 'Expected future rent is below maintenance and opportunity costs.', 'A diversified alternative has a stronger forecast.'],
    concept: 'Sunk-cost fallacy', minLevel: 3, maxLevel: 3,
    tip: 'Past spending matters for learning and taxes, but not for whether the next dollar is worthwhile.',
    choices: [
      { id: 'future_cash_flow', label: 'Reject the repair and reallocate', description: 'Gain 20% off the next planned investment.', effect: { tradeDiscountPercent: 0.20, tradeDiscountUses: 1 }, outcome: 'optimal', impact: '20% discount on the next investment', explanation: 'The repair fails on future economics; previous spending should not force another weak investment.' },
      { id: 'seek_new_quote', label: 'Seek one competitive repair quote', description: 'Pay $40 for better information.', effect: { cash: -40, downsideShieldUses: 1 }, outcome: 'reasonable', impact: '−$40 cash plus 1 downside shield', explanation: 'A bounded information-gathering step is reasonable if it could materially change the forward return.' },
      { id: 'protect_past_spend', label: 'Pay because too much is already invested', description: 'Commit $400 despite the weak forecast.', effect: { cash: -400 }, outcome: 'costly', bias: 'Sunk-cost fallacy', impact: '−$400 cash', explanation: 'The decision is driven by unrecoverable past spending rather than expected future cash flow.' }
    ]
  },
  {
    id: 'decision_l3_overconfidence', category: 'decision', title: 'A Winning Forecast Record',
    scenario: 'Four of your last five market calls were correct. A new opportunity has unusually wide outcomes.',
    objective: 'Pursue upside without risking the portfolio’s long-term survival.',
    evidence: ['Five calls are a small sample.', 'The new investment can lose 45%.', 'Diversification already supports the target return.'],
    concept: 'Overconfidence and sample size', minLevel: 3, maxLevel: 3,
    tip: 'A short winning streak can inflate confidence faster than it improves forecasting skill.',
    choices: [
      { id: 'risk_budget', label: 'Cap the position within a risk budget', description: 'Buy 1 Tech share and gain a shield.', effect: { cash: -110, shares: { TECH: 1 }, downsideShieldUses: 1 }, outcome: 'optimal', impact: '1 Tech share plus 1 downside shield', explanation: 'The choice preserves upside while respecting the large possible loss and uncertain evidence of skill.' },
      { id: 'skip_unclear', label: 'Skip the unclear opportunity', description: 'Keep cash for a better setup.', effect: {}, outcome: 'reasonable', impact: 'No immediate change', explanation: 'Passing is defensible because the range of outcomes is wide, though a small risk-budgeted position was available.' },
      { id: 'bet_big', label: 'Make a large concentrated bet', description: 'Commit $500 and incur a $100 leverage cost.', effect: { cash: -600, shares: { TECH: 5 } }, outcome: 'costly', bias: 'Overconfidence bias', impact: '5 concentrated shares and −$100 excess financing cost', explanation: 'A five-call sample does not justify ignoring the stated 45% downside and portfolio-survival objective.' }
    ]
  },
  {
    id: 'decision_l3_private_group', category: 'decision', title: 'The Private Group-Chat Leak',
    scenario: 'A private investing group says a member’s friend works for a supplier and knows that Nova Tech will announce a major contract tomorrow.',
    objective: 'Protect the portfolio while separating social proximity, rumor and potentially unlawful information from verified public evidence.',
    evidence: ['The claim cannot be confirmed publicly.', 'Members are posting screenshots of large buy orders.', 'Trading material non-public information is illegal in real life.'],
    concept: 'Private-group influence, FOMO and information ethics', minLevel: 3, maxLevel: 3,
    socialMediaScenario: true, socialSource: 'Private investment group chat',
    tip: 'Someone sounding close to a company does not make a rumor reliable—and material non-public information must not be traded in real life.',
    choices: [
      { id: 'reject_leak_public_research', label: 'Reject the leak and use public research', description: 'Gain 2 shields and 20% off a lawful researched trade.', effect: { downsideShieldUses: 2, tradeDiscountPercent: 0.20, tradeDiscountUses: 1 }, outcome: 'optimal', impact: '2 shields plus a 20% research discount', explanation: 'You avoided both an unverifiable rumor and the legal risk of acting on supposed non-public information.', socialInfluence: { verification: 20, hypePull: -14, independentJudgment: 14, insight: 'You refused to let exclusivity, screenshots and group urgency override evidence and legality.' } },
      { id: 'wait_for_public_news', label: 'Wait for a public announcement', description: 'Keep cash available and make no trade.', effect: {}, outcome: 'reasonable', impact: 'No immediate portfolio change', explanation: 'Waiting avoids acting on the leak, although a full independent valuation process would be stronger.', socialInfluence: { verification: 8, hypePull: -6, independentJudgment: 8, insight: 'You resisted the group’s urgency and required information to become public before acting.' } },
      { id: 'trade_before_announcement', label: 'Buy before the group loses its edge', description: 'Commit $600 and incur a $180 rumor reversal cost.', effect: { cash: -780, shares: { TECH: 5 } }, outcome: 'costly', bias: 'FOMO and authority-by-proximity', impact: '5 concentrated shares plus a $180 rumor cost', explanation: 'Private-group confidence, order screenshots and claimed proximity are not reliable evidence. Real insider trading can also be illegal.', socialInfluence: { verification: -20, hypePull: 24, independentJudgment: -14, insight: 'Exclusivity and fear of missing out overpowered source verification and legal caution.' } }
    ]
  },
  {
    id: 'decision_l3_disposition', category: 'decision', title: 'Review Winners and Losers',
    scenario: 'One holding is up 30% with improving fundamentals. Another is down 25% after its competitive advantage weakened.',
    objective: 'Rebalance using forward-looking evidence rather than the desire to feel successful or avoid regret.',
    evidence: ['The winner’s valuation is higher but fundamentals improved.', 'The loser’s original thesis weakened.', 'Tax and transaction costs are modest in this game.'],
    concept: 'Disposition effect', minLevel: 3, maxLevel: 3,
    tip: 'Investors often sell winners too early and keep losers too long to avoid admitting a loss.',
    choices: [
      { id: 'forward_returns', label: 'Rank both by future return and risk', description: 'Gain 2 shields and 15% off the next trade.', effect: { downsideShieldUses: 2, tradeDiscountPercent: 0.15, tradeDiscountUses: 1 }, outcome: 'optimal', impact: '2 downside shields plus 15% off the next investment', explanation: 'This uses current evidence and portfolio fit rather than whether each position is above or below its purchase price.' },
      { id: 'rebalance_targets', label: 'Rebalance both toward target weights', description: 'Gain 1 downside shield.', effect: { downsideShieldUses: 1 }, outcome: 'reasonable', impact: '1 downside shield', explanation: 'Rules-based rebalancing is defensible, though it should still account for the changed fundamentals.' },
      { id: 'sell_winner_hold_loser', label: 'Sell the winner and wait for the loser to recover', description: 'Lose $150 to the biased allocation.', effect: { cash: -150 }, outcome: 'costly', bias: 'Disposition effect', impact: '−$150 cash', explanation: 'The decision protects feelings about gains and losses instead of responding to the forward-looking evidence.' }
    ]
  }
];
