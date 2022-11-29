import * as ts from "typescript";

const abstractHostApiTransformer: ts.TransformerFactory<ts.SourceFile> = (context ) => {
    return sourceFile => {
        const apiParam = global.ABSTRACT_HOST_API_PARAM;

        const visitor = (node: ts.Node) => {
            if (ts.isExportAssignment(node)) {
                const newNode = ts.factory.createExpressionStatement(
                    ts.factory.createBinaryExpression(
                        ts.factory.createPropertyAccessExpression(
                            ts.factory.createIdentifier('window'),
                            ts.factory.createIdentifier(apiParam),
                        ),
                        ts.SyntaxKind.EqualsToken,
                        node.expression,
                    )
                );

                const callExpression = ts.factory.createExpressionStatement(
                    ts.factory.createCallExpression(
                        ts.factory.createPropertyAccessChain(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier('window'),
                                ts.factory.createIdentifier(apiParam),
                            ),
                            ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                            'init'
                        ),
                        undefined,
                        []
                    ),
                );

                return [newNode, callExpression];
            }

            return ts.visitEachChild(node, visitor, context);
        };

        return ts.visitNode(sourceFile, visitor);
    }
};

export default abstractHostApiTransformer;
