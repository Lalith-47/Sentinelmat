# SentinelMAT: Mathematical Formulations & Analytical Methods

This document details the mathematical algorithms, statistical models, and capacity forecasting techniques implemented in **SentinelMAT**'s MATLAB numerical suite (`matlab/`).

---

## 1. Descriptive Statistics & Distribution Analysis (`calculateStatistics.m`)

Let $X = \{x_1, x_2, \dots, x_N\}$ represent a discrete time-series vector of $N$ valid, finite observations of an infrastructure metric (e.g. CPU or Disk utilization).

### 1.1 Arithmetic Mean ($\mu$)
Measures the central tendency of the metric:
$$\mu = \frac{1}{N} \sum_{i=1}^{N} x_i$$

### 1.2 Unbiased Sample Variance ($s^2$) and Standard Deviation ($\sigma$)
Quantifies metric dispersion around the mean using Bessel's correction factor $(N-1)$ to eliminate negative bias in small sample sizes:
$$s^2 = \frac{1}{N-1} \sum_{i=1}^{N} (x_i - \mu)^2$$
$$\sigma = \sqrt{s^2}$$

### 1.3 Percentiles & Interquartile Range (IQR)
Percentiles are evaluated using standard linear interpolation on sorted ranks $x_{(1)} \le x_{(2)} \le \dots \le x_{(N)}$:
$$\text{Rank}(P) = \frac{P}{100} (N - 1) + 1$$
$$Q_1 = P_{25}, \quad M = P_{50} \text{ (Median)}, \quad Q_3 = P_{75}$$
$$\text{IQR} = Q_3 - Q_1$$

Percentiles $P_{90}, P_{95}, P_{99}$ capture peak tail behavior and latency/utilization surges that the arithmetic mean conceals.

### 1.4 Trailing Moving Average ($MA_k$)
Smooths short-term fluctuations to observe underlying trajectory:
$$MA_k(t) = \frac{1}{k} \sum_{j=0}^{k-1} x_{t-j}$$

---

## 2. Statistical Anomaly Detection (`detectAnomalies.m`)

### 2.1 Adaptive Rolling Baseline
Traditional static thresholds fail under fluctuating diurnal infrastructure workloads. SentinelMAT implements an adaptive rolling window $W_t$ of size $w$ preceding the current observation $x_t$:
$$W_t = \{x_{t-w}, x_{t-w+1}, \dots, x_{t-1}\}$$

The local baseline mean $\mu_{W}$ and local baseline standard deviation $\sigma_{W}$ are derived over $W_t$:
$$\mu_{W} = \frac{1}{w} \sum_{k=1}^w x_{t-k}$$
$$\sigma_{W} = \sqrt{\frac{1}{w-1} \sum_{k=1}^w (x_{t-k} - \mu_{W})^2}$$

### 2.2 Standardized Deviation Score ($Z$-Score)
The normalized distance between the current observation $x_t$ and its rolling baseline is computed as:
$$Z_t = \frac{x_t - \mu_{W}}{\max(\sigma_{W}, \epsilon)}$$
where $\epsilon = 10^{-4}$ provides numerical stability against division by zero.

### 2.3 Multi-Level Severity Thresholding
- **Warning Anomaly:** $|Z_t| \ge 2.5$ (exceeds $98.76\%$ of a Gaussian distribution)
- **Critical Anomaly:** $|Z_t| \ge 3.5$ (exceeds $99.95\%$ of a Gaussian distribution)

### 2.4 Zero-Variance & Noise Safeguard
On idle Linux systems, metrics may remain identical across intervals (e.g. steady $2.0\%$ CPU). Under near-zero variance ($\sigma_W \approx 0$), minor micro-variations could produce artificially massive Z-scores. SentinelMAT enforces an absolute delta filter:
$$\text{Trigger Condition} = (|Z_t| \ge Z_{\text{thresh}}) \land (|x_t - \mu_W| \ge 1.0)$$

---

## 3. Resource Capacity Forecasting (`forecastResourceUsage.m`)

### 3.1 Ordinary Least Squares (OLS) Linear Trend Model
To model resource depletion (specifically disk utilization and persistent memory leaks), SentinelMAT constructs a linear regression model parameterized by timestamps $t_i$ and observed values $y_i$:
$$y_t = \hat{\beta}_0 + \hat{\beta}_1 t + \varepsilon_t$$

The analytical parameters minimize the sum of squared residuals $\sum \varepsilon_t^2$:
$$\bar{t} = \frac{1}{N} \sum t_i, \quad \bar{y} = \frac{1}{N} \sum y_i$$
$$\hat{\beta}_1 = \frac{\sum_{i=1}^N (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i=1}^N (t_i - \bar{t})^2}$$
$$\hat{\beta}_0 = \bar{y} - \hat{\beta}_1 \bar{t}$$

### 3.2 Time-To-Exhaustion (TTE) Derivation
Given a critical saturation threshold $Y_{\text{crit}}$ (e.g. $90.0\%$ or $95.0\%$ disk capacity), the predicted timestamp $t_{\text{crit}}$ is determined by inverting the linear regression equation:
$$t_{\text{crit}} = \frac{Y_{\text{crit}} - \hat{\beta}_0}{\hat{\beta}_1}$$

The remaining operational time (in seconds and hours) is:
$$\Delta t_{\text{TTE}} = t_{\text{crit}} - t_{\text{now}} = \frac{Y_{\text{crit}} - y_{\text{now}}}{\hat{\beta}_1}$$

### 3.3 Validity Constraints
1. **Positive Slope Requirement:** Exhaustion is computed if and only if $\hat{\beta}_1 > 10^{-9}$. If $\hat{\beta}_1 \le 0$, usage is flat or declining, and TTE is correctly returned as `NaN` rather than a nonsensical negative time.
2. **Current Saturation Check:** If $y_{\text{now}} \ge Y_{\text{crit}}$, TTE is reported as $0$ hours with critical alert.
3. **Minimum Sample Count:** A minimum of $N \ge 10$ historical points is required before fitting regression parameters.

### 3.4 Coefficient of Determination ($R^2$)
Measures the proportion of variance explained by the linear trend:
$$SS_{\text{tot}} = \sum_{i=1}^N (y_i - \bar{y})^2, \quad SS_{\text{res}} = \sum_{i=1}^N (y_i - \hat{y}_i)^2$$
$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$$

---

## 4. Model Evaluation & Out-of-Sample Accuracy (`evaluatePredictions.m`)

To prevent overfitting and quantify prediction uncertainty without making false assumptions, SentinelMAT uses chronological train/test partitioning ($80\%$ train, $20\%$ test):

- **Mean Absolute Error (MAE):**
  $$\text{MAE} = \frac{1}{M} \sum_{i=1}^M |y_i - \hat{y}_i|$$

- **Root Mean Squared Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{M} \sum_{i=1}^M (y_i - \hat{y}_i)^2}$$

- **Mean Absolute Percentage Error (MAPE):**
  $$\text{MAPE} = \frac{100\%}{M} \sum_{i=1}^M \left|\frac{y_i - \hat{y}_i}{y_i + \epsilon}\right|$$

- **Directional Accuracy:**
  $$\text{DA} = \frac{100\%}{M} \sum_{i=1}^M \mathbb{I}\left( \text{sgn}(y_i - y_{i-1}) = \text{sgn}(\hat{y}_i - y_{i-1}) \right)$$
