# LiquidityMath

## Overview

The `LiquidityMath` contract provides a function to calculate the optimal amount of a token to swap when adding liquidity to a pool, specifically for a Uniswap V2-style pool without concentrated liquidity. This ensures that the user's holdings are proportional to the pool's reserves.

## Derivation

1. **Initial constant product**:
   ![k = reserveA * reserveB](media/math/ql_ef6f54c706b1b7ff64d51182cb54f41f_l3.png)

2. **After swap, the new reserveB**:
   ![k = (reserveA + (1 - fee) * swapA) * reserveB'](url_to_image_2)

3. **Amount of asset B received**:
   ![rcvB = reserveB - reserveB'](url_to_image_3)
   ![rcvB = reserveB - \frac{k}{reserveA + (1 - fee) * swapA}](url_to_image_4)
   ![rcvB = reserveB - \frac{reserveA * reserveB}{reserveA + (1 - fee) * swapA}](url_to_image_5)
   ![rcvB = \frac{(1 - fee) * reserveB * swapA}{reserveA + (1 - fee) * swapA}](url_to_image_6)

4. **Equality constraint on user's asset ratio and reserve's asset ratio**:
   ![\frac{amountA - swapA}{reserveA + swapA} = \frac{rcvB}{reserveB'}](url_to_image_7)

5. **Substitute known variables**:
   ![(1 - fee) * (swapA)^2 + (2 - fee) * reserveA * swapA - amountA * reserveA = 0](url_to_image_8)

6. **Solve for swapA**:
   ![swapA = \frac{\sqrt{((2 - fee) * reserveA)^2 + 4 * (1 - fee) * amountA * reserveA} - (2 - fee) * reserveA}{2 * (1 - fee)}](url_to_image_9)

7. **With fee represented in hundredths of a bip**:
   ![swapA = \frac{\sqrt{(2 * 10^6 - fee)^2 * reserveA^2 + 4 * 10^6 * (10^6 - fee) * amountA * reserveA} - (2 * 10^6 - fee) * reserveA}{2 * (10^6 - fee)}](url_to_image_10)

## Final Equation

![swapA = \frac{\sqrt{(2 * 10^6 - fee)^2 * reserveA^2 + 4 * 10^6 * (10^6 - fee) * amountA * reserveA} - (2 * 10^6 - fee) * reserveA}{2 * (10^6 - fee)}](url_to_image_11)

Where:

- \(\text{fee}\) is the swap fee in hundredths of a bip.
- \(\text{reserveA}\) is the reserve of token A in the pool.
- \(\text{amountA}\) is the amount of token A to add.

This equation ensures that the proportion of assets the user holds is equal to the proportion of assets in the reserves after the swap.
