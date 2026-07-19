-- CreateIndex
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_brand_trgm_idx" ON "Product" USING GIN ("brand" gin_trgm_ops);

