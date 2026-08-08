from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class AdminOverviewResponse(BaseModel):
    total_users: int = Field(alias="totalUsers")
    total_kb_documents: int = Field(alias="totalKbDocuments")
    jobs_queued: int = Field(alias="jobsQueued")
    storage_used_mb: float = Field(alias="storageUsedMb")

    model_config = ConfigDict(populate_by_name=True)

class AdminSystemMonitoring(BaseModel):
    cpu_usage_pct: float = Field(alias="cpuUsagePct")
    memory_usage_pct: float = Field(alias="memoryUsagePct")
    disk_usage_pct: float = Field(alias="diskUsagePct")
    api_uptime_pct: float = Field(default=99.98, alias="apiUptimePct")
    error_rate_pct: float = Field(default=0.01, alias="errorRatePct")

    model_config = ConfigDict(populate_by_name=True)

class AdminModelConfig(BaseModel):
    llm: str = "Gemini 2.5 Flash"
    embedding_model: str = Field(default="all-MiniLM-L6-v2", alias="embeddingModel")
    vector_dim: int = Field(default=384, alias="vectorDim")
    distance_metric: str = Field(default="Cosine", alias="distanceMetric")

    model_config = ConfigDict(populate_by_name=True)
